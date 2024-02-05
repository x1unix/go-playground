package storage

import (
	"context"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"sync"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/tevino/abool"
	"github.com/x1unix/go-playground/pkg/testutil"
	"go.uber.org/zap/zaptest"
)

func getTestDir(t *testing.T) string {
	t.Helper()
	d, err := os.MkdirTemp(os.TempDir(), "storage_test")
	require.NoError(t, err)
	return d
}

func TestLocalStorage_GetItem(t *testing.T) {
	r := require.New(t)
	testDir := getTestDir(t)
	defer os.RemoveAll(testDir)
	s, err := NewLocalStorage(zaptest.NewLogger(t), testDir)
	r.NoError(err, "failed to create test storage")
	r.Falsef(s.dirty.IsSet(), "dirty flag is not false")

	entries := map[string][]byte{
		"test1.go":   []byte("foo"),
		"foo/bar.go": []byte("bar"),
	}
	aid, err := GetArtifactID(entries)
	require.NoError(t, err, "failed to create a test artifact ID")

	// check not existing item
	ok, err := s.HasItem(aid)
	require.NoError(t, err)
	require.False(t, ok)

	_, err = s.GetItem(aid)
	r.EqualError(err, ErrNotExists.Error(), "got unexpected error type")

	// Start trash collector in background
	ctx, cancelFunc := context.WithCancel(context.Background())
	t.Cleanup(cancelFunc)

	// Create some data
	workspace, err := s.CreateWorkspace(aid, entries)
	require.NoError(t, err, "Workspace create error")
	strEndsWith(t, workspace.BinaryPath, ExtWasm)
	require.Len(t, workspace.Files, len(entries))

	for fileName, expectData := range entries {
		absPath := filepath.Join(workspace.WorkDir, fileName)
		require.Contains(t, workspace.Files, absPath, "missing file in workspace")
		gotData, err := os.ReadFile(absPath)

		require.NoError(t, err, "can't access expected file")
		require.Equalf(t, expectData, gotData, "file content mismatch: %q", absPath)
	}

	// Check storage dirty state
	r.True(s.dirty.IsSet(), "dirty flag should be true after file manipulation")

	binData := []byte("TEST")
	require.NoError(t, os.WriteFile(workspace.BinaryPath, binData, perm), "binary path not writable")

	// Try to get item from storage
	has, err := s.HasItem(aid)
	require.NoError(t, err)
	require.True(t, has)
	dataFile, err := s.GetItem(aid)
	defer dataFile.Close()
	r.NoError(err, "failed to get saved bin data")

	gotBinData, err := io.ReadAll(dataFile)
	require.NoError(t, err, "can't read back bin data")
	r.Equal(binData, gotBinData, "bin data mismatch")

	// Trash collector should clean all our garbage after some time
	require.NoError(t, s.Clean(ctx))
	r.False(s.dirty.IsSet(), "storage is still dirty after cleanup")
	_, err = s.GetItem(aid)
	r.Error(err, "test item was not removed after cleanup")
	r.EqualError(err, ErrNotExists.Error(), "should return ErrNotExists")
	cancelFunc()

	require.NoError(t, os.RemoveAll(testDir), "failed to remove test dir after exit")
}

func TestLocalStorage_clean(t *testing.T) {
	tempDir, err := ioutil.TempDir(os.TempDir(), "tempstore")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	cases := map[string]struct {
		dir     string
		store   *LocalStorage
		wantErr string
	}{
		"clean existing dir": {
			dir: tempDir,
		},
		"clean error": {
			store: &LocalStorage{
				log:     zaptest.NewLogger(t),
				workDir: "/a/b/c/d",
				useLock: &sync.Mutex{},
				dirty:   abool.NewBool(false),
				gcRun:   abool.NewBool(false),
				binDir:  filepath.Join("/dev", binDirName),
				srcDir:  filepath.Join("/dev", srcDirName),
			},
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			if c.store == nil {
				store, err := NewLocalStorage(zaptest.NewLogger(t), c.dir)
				require.NoError(t, err)
				c.store = store
			}

			c.store.dirty.Set()
			err := c.store.clean()
			if c.wantErr != "" {
				testutil.ContainsError(t, err, c.wantErr)
				return
			}
			require.NoError(t, err)
		})
	}
}

func strEndsWith(t *testing.T, str string, suffix string) {
	t.Helper()
	got := str[len(str)-len(suffix):]
	require.Equal(t, suffix, got)
}
