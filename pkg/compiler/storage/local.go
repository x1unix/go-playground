package storage

import (
	"context"
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
	useLock *sync.Mutex
}

func (c cachedFile) Read(p []byte) (n int, err error) {
	c.useLock.Lock()
	defer c.useLock.Unlock()
	return c.ReadCloser.Read(p)
}

// LocalStorage is local build artigact storage
type LocalStorage struct {
	log     *zap.SugaredLogger
	useLock *sync.Mutex
	dirty   *abool.AtomicBool
	gcRun   *abool.AtomicBool
	workDir string
	srcDir  string
	binDir  string
}

// NewLocalStorage constructs new local storage
func NewLocalStorage(log *zap.SugaredLogger, baseDir string) (ls *LocalStorage, err error) {
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
		logger.Errorw("failed to check if work dir is dirty", "err", err)
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
func (s LocalStorage) GetItem(id ArtifactID) (io.ReadCloser, error) {
	s.useLock.Lock()
	defer s.useLock.Unlock()
	fPath := s.getOutputLocation(id)
	f, err := os.Open(fPath)
	if os.IsNotExist(err) {
		return nil, ErrNotExists
	}

	return cachedFile{
		ReadCloser: f,
		useLock:    s.useLock,
	}, err
}

// CreateLocationAndDo implements storage interface
func (s LocalStorage) CreateLocationAndDo(id ArtifactID, data []byte, cb Callback) error {
	s.useLock.Lock()
	defer s.useLock.Unlock()
	s.dirty.Set() // mark storage as dirty
	tmpSrcDir := filepath.Join(s.srcDir, id.String())
	if err := os.MkdirAll(tmpSrcDir, perm); err != nil {
		if !os.IsExist(err) {
			s.log.Errorw("failed to create a temporary build directory",
				"artifact", id.String(),
				"dir", tmpSrcDir,
				"err", err.Error(),
			)
			return errors.Wrapf(err, "failed to create temporary build directory")
		}

		s.log.Debugw("build directory already exists", "artifact", id.String())
	}

	wasmLocation := s.getOutputLocation(id)
	goFileName := id.Ext(ExtGo)
	srcFile := filepath.Join(tmpSrcDir, goFileName)
	if err := os.WriteFile(srcFile, data, perm); err != nil {
		s.log.Errorw(
			"failed to save source file",
			"artifact", id.String(),
			"file", srcFile,
			"err", err,
		)

		return errors.Wrapf(err, "failed to save source file %q", goFileName)
	}

	return cb(wasmLocation, srcFile)
}

func (s LocalStorage) clean() error {
	if !s.dirty.IsSet() {
		s.log.Debug("storage is not dirty, skipping")
		return nil
	}

	s.log.Debug("cleanup start")
	t := time.AfterFunc(maxCleanTime, func() {
		s.log.Warnf("cleanup took more than %.0f seconds!", maxCleanTime.Seconds())
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

		s.log.Debugf("cleaner: removed directory %q", dir)
	}

	s.dirty.UnSet() // remove dirty flag
	s.log.Debug("cleaner: cleanup end")
	return nil
}

// StartCleaner implements storage interface
func (s LocalStorage) StartCleaner(ctx context.Context, interval time.Duration, wg *sync.WaitGroup) {
	s.gcRun.Set()
	s.log.Debug("cleaner worker starter")
	for {
		select {
		case <-ctx.Done():
			s.log.Debug("context done, cleaner worker stopped")
			s.gcRun.UnSet()
			if wg != nil {
				wg.Done()
			}
			return
		default:
		}

		<-time.After(interval)
		if err := s.clean(); err != nil {
			s.log.Error(err)
		}
	}
}
