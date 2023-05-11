package compiler

import (
	"context"
	"errors"
	"io/ioutil"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/internal/compiler/storage"
	"github.com/x1unix/go-playground/pkg/testutil"
	"github.com/x1unix/go-playground/pkg/util/osutil"
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
	getItem             func(id storage.ArtifactID) (storage.ReadCloseSizer, error)
	createLocationAndDo func(id storage.ArtifactID, data []byte, cb storage.Callback) error
}

// HasItem checks if item exists
func (ts testStorage) HasItem(id storage.ArtifactID) (bool, error) {
	return ts.hasItem(id)
}

// GetItem returns item by id
func (ts testStorage) GetItem(id storage.ArtifactID) (storage.ReadCloseSizer, error) {
	return ts.getItem(id)
}

// CreateLocationAndDo creates entry in storage and runs specified callback with new location
func (ts testStorage) CreateLocationAndDo(id storage.ArtifactID, data []byte, cb storage.Callback) error {
	return ts.createLocationAndDo(id, data, cb)
}

func TestBuildService_GetArtifact(t *testing.T) {
	cases := map[string]struct {
		artifactID storage.ArtifactID
		wantErr    string
		beforeRun  func(t *testing.T) storage.StoreProvider
	}{
		"works": {
			artifactID: "test",
			beforeRun: func(t *testing.T) storage.StoreProvider {
				return testStorage{
					getItem: func(id storage.ArtifactID) (storage.ReadCloseSizer, error) {
						require.Equal(t, "test", string(id))
						return &testReadCloser{}, nil
					},
				}
			},
		},
		"handle error": {
			artifactID: "foobar",
			wantErr:    "test error",
			beforeRun: func(t *testing.T) storage.StoreProvider {
				return testStorage{
					getItem: func(id storage.ArtifactID) (storage.ReadCloseSizer, error) {
						require.Equal(t, "foobar", string(id))
						return nil, errors.New("test error")
					},
				}
			},
		},
	}

	for k, v := range cases {
		t.Run(k, func(t *testing.T) {
			ts := v.beforeRun(t)
			bs := NewBuildService(zaptest.NewLogger(t).Sugar(), BuildEnvironmentConfig{}, ts)
			got, err := bs.GetArtifact(v.artifactID)
			if v.wantErr != "" {
				require.Error(t, err)
				require.EqualError(t, err, v.wantErr)
				return
			}
			require.NoError(t, err)
			require.NotNil(t, got)
		})
	}
}

func TestBuildService_Build(t *testing.T) {
	tempDir, err := ioutil.TempDir(os.TempDir(), "tempstore")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)
	cases := map[string]struct {
		skip         bool
		data         []byte
		wantErr      string
		wantResult   *Result
		beforeRun    func(t *testing.T)
		onErrorCheck func(t *testing.T, err error)
		store        func(t *testing.T) (storage.StoreProvider, func() error)
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
			wantErr: "can't load package",
			store: func(t *testing.T) (storage.StoreProvider, func() error) {
				s, err := storage.NewLocalStorage(zaptest.NewLogger(t).Sugar(), tempDir)
				require.NoError(t, err)
				return s, func() error {
					return os.RemoveAll(tempDir)
				}
			},
			onErrorCheck: func(t *testing.T, err error) {
				_, ok := err.(*BuildError)
				require.True(t, ok, "expected compiler error")
			},
		},
		"bad environment": {
			wantErr: `executable file not found`,
			store: func(t *testing.T) (storage.StoreProvider, func() error) {
				t.Setenv("PATH", ".")
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
			if c.beforeRun != nil {
				c.beforeRun(t)
			}

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

			bs := NewBuildService(zaptest.NewLogger(t).Sugar(), BuildEnvironmentConfig{}, store)
			got, err := bs.Build(context.TODO(), c.data)
			if c.wantErr != "" {
				if c.onErrorCheck != nil {
					c.onErrorCheck(t, err)
					return
				}
				testutil.ContainsError(t, err, c.wantErr)
				return
			}
			require.NoError(t, err)
			require.NotNil(t, got)
			require.Equal(t, c.wantResult, got)
		})
	}
}

func TestBuildService_getEnvironmentVariables(t *testing.T) {
	cases := map[string]struct {
		includedVars osutil.EnvironmentVariables
		check        func(t *testing.T, included osutil.EnvironmentVariables, result []string)
	}{
		"include vars": {
			includedVars: osutil.EnvironmentVariables{
				"FOOBAR": "BAZ",
				"GOOS":   "stub-value",
			},
			check: func(t *testing.T, included osutil.EnvironmentVariables, result []string) {
				got := osutil.SplitEnvironmentValues(result)
				expect := included.Concat(predefinedBuildVars)
				require.Equal(t, expect, got)
			},
		},
		"ignore vars if empty": {
			check: func(t *testing.T, _ osutil.EnvironmentVariables, result []string) {
				got := osutil.SplitEnvironmentValues(result)
				require.Equal(t, predefinedBuildVars, got)
			},
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			cfg := BuildEnvironmentConfig{
				IncludedEnvironmentVariables: c.includedVars,
			}
			svc := NewBuildService(zaptest.NewLogger(t).Sugar(), cfg, nil)
			got := svc.getEnvironmentVariables()
			c.check(t, c.includedVars, got)
		})
	}
}

func mustArtifactID(t *testing.T, data []byte) storage.ArtifactID {
	t.Helper()
	a, err := storage.GetArtifactID(data)
	require.NoError(t, err)
	return a
}

func TestBuildError_Error(t *testing.T) {
	msg := "test"
	require.Equal(t, msg, newBuildError(msg).Error())
}
