package storage

import (
	"context"
	"errors"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zaptest"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

var testDir = os.TempDir()

func TestLocalStorage_GetItem(t *testing.T) {
	r := require.New(t)
	s, err := NewLocalStorage(zaptest.NewLogger(t).Sugar(), testDir)
	r.NoError(err, "failed to create test storage")
	r.Falsef(s.dirty.IsSet(), "dirty flag is not false")
	expectData := []byte("foo")
	aid, err := GetArtifactID(expectData)
	must(t, err, "failed to create a test artifact ID")

	_, err = s.GetItem(aid)
	r.EqualError(err, ErrNotExists.Error(), "got unexpected error type")

	// Start trash collector in background
	ctx, cancelFunc := context.WithCancel(context.Background())
	cleanInterval := time.Second * 2
	go s.StartCleaner(ctx, cleanInterval, nil)
	defer cancelFunc()
	runtime.Gosched() // Ask Go to switch to cleaner goroutine
	r.True(s.gcRun.IsSet(), "gc start flag not true")

	// Create some data
	expErr := errors.New("create error")
	err = s.CreateLocationAndDo(aid, expectData, func(wasmLocation, sourceLocation string) error {
		strEndsWith(t, wasmLocation, ExtWasm)
		strEndsWith(t, sourceLocation, ExtGo)
		t.Logf("\nWASM:\t%s\nSRC:\t%s", wasmLocation, sourceLocation)
		f, err := os.Open(sourceLocation)
		r.NoError(err, "failed to open source file")
		data, err := ioutil.ReadAll(f)
		r.NoError(err, "failed to read test file")

		r.Equal(data, expectData, "input and result don't match")
		if err := os.Mkdir(filepath.Join(s.binDir), perm); !os.IsExist(err) {
			must(t, err, "failed to create bin dir")
		}
		err = ioutil.WriteFile(wasmLocation, expectData, perm)
		must(t, err, "failed to write dest file")
		return expErr
	})

	// Check storage dirty state
	r.EqualError(err, expErr.Error(), "expected and returned error mismatch")
	r.True(s.dirty.IsSet(), "dirty flag should be true after file manipulation")

	// Try to get item from storage
	dataFile, err := s.GetItem(aid)
	defer dataFile.Close()
	r.NoError(err, "failed to get saved cached data")

	contents, err := ioutil.ReadAll(dataFile)
	must(t, err, "failed to read saved file")
	r.Equal(expectData, contents)

	// Trash collector should clean all our garbage after some time
	runtime.Gosched()
	time.Sleep(cleanInterval + time.Second)
	r.False(s.dirty.IsSet(), "storage is still dirty after cleanup")
	_, err = s.GetItem(aid)
	r.Error(err, "test item was not removed after cleanup")
	r.EqualError(err, ErrNotExists.Error(), "should return ErrNotExists")
	cancelFunc()

	// Ensure that collector stopped after context done
	time.Sleep(cleanInterval)
	r.False(s.gcRun.IsSet(), "collector not stopped after context death")

	must(t, os.RemoveAll(testDir), "failed to remove test dir after exit")
}

func must(t *testing.T, err error, msg string) {
	if err == nil {
		return
	}
	t.Helper()
	t.Fatalf("test internal error:\t%s - %s", msg, err)
}

func strEndsWith(t *testing.T, str string, suffix string) {
	t.Helper()
	got := str[len(str)-len(suffix):]
	require.Equal(t, suffix, got)
}
