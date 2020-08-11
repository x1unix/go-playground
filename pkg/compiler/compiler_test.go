package compiler

import (
	"context"
	"errors"
	"io"
	"io/ioutil"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/compiler/storage"
	"github.com/x1unix/go-playground/pkg/testutil"
	"go.uber.org/zap/zaptest"
)

type testReadCloser struct {
	strings.Reader
}

func (ts *testReadCloser) Close() error {
	return nil
}

type testStorage struct {
	hasItem             func(id storage.ArtifactID) (bool, error)
	getItem             func(id storage.ArtifactID) (io.ReadCloser, error)
	createLocationAndDo func(id storage.ArtifactID, data []byte, cb storage.Callback) error
}

// HasItem checks if item exists
func (ts testStorage) HasItem(id storage.ArtifactID) (bool, error) {
	return ts.hasItem(id)
}

// GetItem returns item by id
func (ts testStorage) GetItem(id storage.ArtifactID) (io.ReadCloser, error) {
	return ts.getItem(id)
}

// CreateLocationAndDo creates entry in storage and runs specified callback with new location
func (ts testStorage) CreateLocationAndDo(id storage.ArtifactID, data []byte, cb storage.Callback) error {
	return ts.createLocationAndDo(id, data, cb)
}

func TestBuildService_GetArtifact(t *testing.T) {
	aid := storage.ArtifactID("test")
	ts := testStorage{
		getItem: func(id storage.ArtifactID) (io.ReadCloser, error) {
			require.Equal(t, aid, id)
			return &testReadCloser{}, nil
		},
	}
	bs := NewBuildService(zaptest.NewLogger(t).Sugar(), ts)
	got, err := bs.GetArtifact(aid)
	require.NoError(t, err)
	require.NotNil(t, got)
}

func TestBuildService_Build(t *testing.T) {
	cases := map[string]struct {
		skip       bool
		data       []byte
		wantErr    string
		wantResult *Result
		store      func(t *testing.T) (storage.StoreProvider, func() error)
	}{
		"bad store": {
			wantErr: "test error",
			store: func(t *testing.T) (storage.StoreProvider, func() error) {
				return testStorage{
					hasItem: func(id storage.ArtifactID) (bool, error) {
						return false, errors.New("test error")
					},
				}, nil
			},
		},
		"cached build": {
			data: []byte("test"),
			wantResult: &Result{
				FileName: mustArtifactID(t, []byte("test")).String() + ".wasm",
			},
			store: func(t *testing.T) (storage.StoreProvider, func() error) {
				return testStorage{
					hasItem: func(id storage.ArtifactID) (bool, error) {
						w := mustArtifactID(t, []byte("test"))
						require.Equal(t, w, id)
						return true, nil
					},
				}, nil
			},
		},
		"new build": {
			store: func(t *testing.T) (storage.StoreProvider, func() error) {
				tempDir, err := ioutil.TempDir(os.TempDir(), "tempstore")
				require.NoError(t, err)

				s, err := storage.NewLocalStorage(zaptest.NewLogger(t).Sugar(), tempDir)
				require.NoError(t, err)
				return s, func() error {
					return os.RemoveAll(tempDir)
				}
			},
		},
	}

	for n, c := range cases {
		if c.skip {
			continue
		}
		t.Run(n, func(t *testing.T) {
			store, cancel := c.store(t)
			if cancel != nil {
				defer func() {
					if err := cancel(); err != nil {
						t.Logf("Warning: %s", err)
						return
					}
					t.Log("defer success")
				}()
			}

			bs := NewBuildService(zaptest.NewLogger(t).Sugar(), store)
			got, err := bs.Build(context.TODO(), c.data)
			if c.wantErr != "" {
				testutil.ContainsError(t, err, c.wantErr)
				return
			}
			require.NoError(t, err)
			require.NotNil(t, got)
			require.Equal(t, c.wantResult, got)
		})
	}
}

func mustArtifactID(t *testing.T, data []byte) storage.ArtifactID {
	t.Helper()
	a, err := storage.GetArtifactID(data)
	require.NoError(t, err)
	return a
}
