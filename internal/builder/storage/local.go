package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/pkg/errors"
	"github.com/tevino/abool"
	"go.uber.org/zap"
)

const (
	srcDirName  = "src"
	binDirName  = "bin"
	workDirName = "goplay-builds"

	maxCleanTime = time.Second * 10
	perm         = 0744
)

type cachedFile struct {
	io.ReadCloser

	size    int64
	useLock *sync.Mutex
}

func (c cachedFile) Size() int64 {
	return c.size
}

func (c cachedFile) Read(p []byte) (n int, err error) {
	c.useLock.Lock()
	defer c.useLock.Unlock()
	return c.ReadCloser.Read(p)
}

// LocalStorage is local build artifact storage
type LocalStorage struct {
	log     *zap.Logger
	useLock *sync.Mutex
	dirty   *abool.AtomicBool
	gcRun   *abool.AtomicBool
	workDir string
	srcDir  string
	binDir  string
}

// NewLocalStorage constructs new local storage
func NewLocalStorage(log *zap.Logger, baseDir string) (ls *LocalStorage, err error) {
	var isDirty bool
	logger := log.Named("storage")
	workDir := filepath.Join(baseDir, workDirName)
	if err = os.MkdirAll(workDir, perm); err != nil {
		if !os.IsExist(err) {
			return nil, errors.Wrap(err, "failed to create temporary build directory for WASM compiler")
		}
	}

	isDirty, err = isDirDirty(workDir)
	if err != nil {
		logger.Error("failed to check if work dir is dirty", zap.Error(err))
	}

	if isDirty {
		logger.Info("storage directory is not empty and dirty")
	}

	return &LocalStorage{
		log:     logger,
		workDir: workDir,
		useLock: &sync.Mutex{},
		dirty:   abool.NewBool(isDirty),
		gcRun:   abool.NewBool(false),
		binDir:  filepath.Join(workDir, binDirName),
		srcDir:  filepath.Join(workDir, srcDirName),
	}, nil
}

func isDirDirty(dir string) (bool, error) {
	items, err := os.ReadDir(dir)
	if os.IsNotExist(err) {
		return false, nil
	}

	if err != nil {
		return false, err
	}

	return len(items) > 0, nil
}

func (s LocalStorage) getOutputLocation(id ArtifactID) string {
	return filepath.Join(s.binDir, id.Ext(ExtWasm))
}

// HasItem implements storage interface
func (s LocalStorage) HasItem(id ArtifactID) (bool, error) {
	s.useLock.Lock()
	defer s.useLock.Unlock()
	fPath := s.getOutputLocation(id)
	_, err := os.Stat(fPath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}

		return false, err
	}

	return true, nil
}

// GetItem implements storage interface
func (s LocalStorage) GetItem(id ArtifactID) (ReadCloseSizer, error) {
	s.useLock.Lock()
	defer s.useLock.Unlock()
	fPath := s.getOutputLocation(id)
	f, err := os.Open(fPath)
	if os.IsNotExist(err) {
		return nil, ErrNotExists
	}

	stat, err := f.Stat()
	if err != nil {
		_ = f.Close()
		return nil, err
	}

	return cachedFile{
		ReadCloser: f,
		size:       stat.Size(),
		useLock:    s.useLock,
	}, err
}

// CreateWorkspace implements storage interface
func (s LocalStorage) CreateWorkspace(id ArtifactID, files map[string][]byte) (*Workspace, error) {
	s.useLock.Lock()
	defer s.useLock.Unlock()
	s.dirty.Set() // mark storage as dirty

	// Ensure bin dir exists
	if err := os.MkdirAll(s.binDir, perm); err != nil {
		if !os.IsExist(err) {
			s.log.Error("failed to create a binary directory",
				zap.Stringer("artifact", id),
				zap.String("dir", s.binDir),
				zap.Error(err),
			)

			return nil, fmt.Errorf("failed to create artifact directory: %w", err)
		}
	}

	// Write entries
	tmpSrcDir := filepath.Join(s.srcDir, id.String())
	if err := os.MkdirAll(tmpSrcDir, perm); err != nil {
		if !os.IsExist(err) {
			s.log.Error("failed to create a temporary build directory",
				zap.Stringer("artifact", id),
				zap.String("dir", tmpSrcDir),
				zap.Error(err),
			)

			return nil, fmt.Errorf("failed to create temporary build directory: %w", err)
		}

		s.log.Debug("build directory already exists", zap.Stringer("artifact", id))
	}

	wasmLocation := s.getOutputLocation(id)
	fileNames := make([]string, 0, len(files))

	for name, data := range files {
		filePath := filepath.Join(tmpSrcDir, name)
		fileNames = append(fileNames, filePath)
		if err := os.WriteFile(filePath, data, perm); err != nil {
			if err := os.RemoveAll(tmpSrcDir); err != nil {
				s.log.Warn("failed to remove workspace", zap.String("dir", tmpSrcDir), zap.Error(err))
			}

			s.log.Error(
				"failed to save source file",
				zap.Stringer("artifact", id),
				zap.String("file", filePath),
				zap.Error(err),
			)

			return nil, fmt.Errorf("failed to store file %q: %w", name, err)
		}
	}

	return &Workspace{
		WorkDir:    tmpSrcDir,
		BinaryPath: wasmLocation,
		Files:      fileNames,
	}, nil
}

func (s LocalStorage) clean() error {
	if !s.dirty.IsSet() {
		s.log.Debug("storage is not dirty, skipping")
		return nil
	}

	s.log.Debug("cleanup start")
	t := time.AfterFunc(maxCleanTime, func() {
		s.log.Warn("cleanup timeout exceeded", zap.Duration("timeout", maxCleanTime))
	})
	s.useLock.Lock()
	defer s.useLock.Unlock()
	defer t.Stop()

	// cleanup sources and binaries
	for _, dir := range []string{s.srcDir, s.binDir} {
		if err := os.RemoveAll(dir); err != nil {
			if os.IsNotExist(err) {
				continue
			}
			return errors.Wrapf(err, "failed to remove %q", dir)
		}

		s.log.Debug("cleaner: removed directory", zap.String("dir", dir))
	}

	s.dirty.UnSet() // remove dirty flag
	s.log.Debug("cleaner: cleanup end")
	return nil
}

// CleanJobName iemplements builder.Cleaner interface.
func (s LocalStorage) CleanJobName() string {
	return "storage"
}

// Clean implements' builder.Cleaner interface.
func (s LocalStorage) Clean(ctx context.Context) error {
	s.gcRun.Set()
	if err := ctx.Err(); err != nil {
		return err
	}

	return s.clean()
}
