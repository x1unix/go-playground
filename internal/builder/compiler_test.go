package builder

import (
	"context"
	"errors"
	"io/ioutil"
	"os"
	"strings"
	"syscall"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/internal/builder/storage"
	"github.com/x1unix/go-playground/pkg/testutil"
	"github.com/x1unix/go-playground/pkg/util/osutil"
	"go.uber.org/mock/gomock"
	"go.uber.org/zap/zaptest"
)

type testReadCloser struct {
	strings.Reader
}

func (ts *testReadCloser) Close() error {
	return nil
}

type testStorage struct {
	hasItem         func(id storage.ArtifactID) (bool, error)
	getItem         func(id storage.ArtifactID) (storage.ReadCloseSizer, error)
	createWorkspace func(id storage.ArtifactID, entries map[string][]byte) (*storage.Workspace, error)
	clean           func(ctx context.Context) error
}

func (ts testStorage) HasItem(id storage.ArtifactID) (bool, error) {
	return ts.hasItem(id)
}

func (ts testStorage) GetItem(id storage.ArtifactID) (storage.ReadCloseSizer, error) {
	return ts.getItem(id)
}

func (ts testStorage) CreateWorkspace(id storage.ArtifactID, entries map[string][]byte) (*storage.Workspace, error) {
	return ts.createWorkspace(id, entries)
}

func (ts testStorage) Clean(ctx context.Context) error {
	if ts.clean != nil {
		return ts.clean(ctx)
	}

	return errors.New("not implemented")
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
			bs := NewBuildService(zaptest.NewLogger(t), BuildEnvironmentConfig{}, ts)
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
		files        map[string][]byte
		cmdRunner    func(t *testing.T, ctrl *gomock.Controller) CommandRunner
		wantErr      string
		wantResult   func(files map[string][]byte) *Result
		beforeRun    func(t *testing.T)
		onErrorCheck func(t *testing.T, err error)
		store        func(t *testing.T, files map[string][]byte) (storage.StoreProvider, func() error)
	}{
		"bad store": {
			wantErr: "test error",
			files: map[string][]byte{
				"foo.go": []byte("test"),
			},
			store: func(t *testing.T, files map[string][]byte) (storage.StoreProvider, func() error) {
				return testStorage{
					hasItem: func(id storage.ArtifactID) (bool, error) {
						return false, errors.New("test error")
					},
				}, nil
			},
		},
		"cached build": {
			files: map[string][]byte{
				"file.go": []byte("test"),
			},
			wantResult: func(files map[string][]byte) *Result {
				return &Result{
					FileName: mustArtifactID(t, files).String() + ".wasm",
				}
			},
			store: func(t *testing.T, files map[string][]byte) (storage.StoreProvider, func() error) {
				return testStorage{
					hasItem: func(id storage.ArtifactID) (bool, error) {
						w := mustArtifactID(t, files)
						require.Equal(t, w, id)
						return true, nil
					},
				}, nil
			},
		},
		"new build": {
			wantErr: "can't load package",
			files: map[string][]byte{
				"foo.go": []byte("test"),
			},
			store: func(t *testing.T, files map[string][]byte) (storage.StoreProvider, func() error) {
				s, err := storage.NewLocalStorage(zaptest.NewLogger(t), tempDir)
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
			files: map[string][]byte{
				"foo.go": []byte("test"),
			},
			store: func(t *testing.T, files map[string][]byte) (storage.StoreProvider, func() error) {
				t.Setenv("PATH", ".")
				s, err := storage.NewLocalStorage(zaptest.NewLogger(t), tempDir)
				require.NoError(t, err)
				return s, func() error {
					return os.RemoveAll(tempDir)
				}
			},
		},
		"empty project": {
			wantErr: "no buildable Go source files",
			store: func(t *testing.T, _ map[string][]byte) (storage.StoreProvider, func() error) {
				return nil, nil
			},
		},
		"too many files": {
			wantErr: "too many files",
			files: map[string][]byte{
				"0":  nil,
				"1":  nil,
				"2":  nil,
				"3":  nil,
				"4":  nil,
				"5":  nil,
				"6":  nil,
				"7":  nil,
				"8":  nil,
				"9":  nil,
				"10": nil,
				"11": nil,
				"12": nil,
			},
			store: func(t *testing.T, _ map[string][]byte) (storage.StoreProvider, func() error) {
				return nil, nil
			},
		},
		"path too deep": {
			wantErr: "file path is too deep",
			files: map[string][]byte{
				"a/b/c/d/e/f/g/h/i.go": []byte("package main"),
			},
			store: func(t *testing.T, _ map[string][]byte) (storage.StoreProvider, func() error) {
				return nil, nil
			},
		},
		"empty file": {
			wantErr: "file main.go is empty",
			files: map[string][]byte{
				"main.go": []byte("  "),
			},
			store: func(t *testing.T, _ map[string][]byte) (storage.StoreProvider, func() error) {
				return nil, nil
			},
		},
		"bad path": {
			wantErr: "invalid file name",
			files: map[string][]byte{
				"../main.go": []byte("a"),
			},
			store: func(t *testing.T, _ map[string][]byte) (storage.StoreProvider, func() error) {
				return nil, nil
			},
		},
		"non go files": {
			wantErr: "invalid file name",
			files: map[string][]byte{
				"text.png": []byte("a"),
			},
			store: func(t *testing.T, _ map[string][]byte) (storage.StoreProvider, func() error) {
				return nil, nil
			},
		},
		"handle no space left": {
			wantErr: "no space left",
			files: map[string][]byte{
				"main.go": []byte("package main"),
			},
			store: func(t *testing.T, _ map[string][]byte) (storage.StoreProvider, func() error) {
				return testStorage{
					hasItem: func(id storage.ArtifactID) (bool, error) {
						return false, nil
					},
					createWorkspace: func(id storage.ArtifactID, entries map[string][]byte) (*storage.Workspace, error) {
						return nil, &os.PathError{Err: syscall.ENOSPC, Op: "write"}
					},
					clean: func(_ context.Context) error {
						t.Log("cleanup called")
						return nil
					},
				}, nil
			},
			cmdRunner: func(t *testing.T, ctrl *gomock.Controller) CommandRunner {
				m := NewMockCommandRunner(ctrl)
				m.EXPECT().RunCommand(testutil.MatchCommand("go", "clean", "-modcache", "-cache", "-testcache", "-fuzzcache")).Return(nil)
				return m
			},
		},
		"unit test build": {
			files: map[string][]byte{
				"main_test.go": []byte("package main"),
				"go.mod":       []byte("module foo"),
			},
			store: func(t *testing.T, _ map[string][]byte) (storage.StoreProvider, func() error) {
				return testStorage{
					hasItem: func(id storage.ArtifactID) (bool, error) {
						return false, nil
					},
					createWorkspace: func(id storage.ArtifactID, entries map[string][]byte) (*storage.Workspace, error) {
						return &storage.Workspace{
							WorkDir:    "/tmp",
							BinaryPath: "test.wasm",
							Files:      nil,
						}, nil
					},
					clean: func(_ context.Context) error {
						t.Log("cleanup called")
						return nil
					},
				}, nil
			},
			cmdRunner: func(t *testing.T, ctrl *gomock.Controller) CommandRunner {
				m := NewMockCommandRunner(ctrl)
				m.EXPECT().RunCommand(testutil.MatchCommand("go", "mod", "tidy")).Return(nil)
				m.EXPECT().RunCommand(testutil.MatchCommand("go", "test", "-c", "-o", "test.wasm")).Return(nil)
				return m
			},
			wantResult: func(files map[string][]byte) *Result {
				return &Result{
					FileName: mustArtifactID(t, files).String() + ".wasm",
					IsTest:   true,
				}
			},
		},
	}

	for n, c := range cases {
		if c.skip {
			continue
		}
		t.Run(n, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			if c.beforeRun != nil {
				c.beforeRun(t)
			}

			store, cancel := c.store(t, c.files)
			if cancel != nil {
				defer func() {
					if err := cancel(); err != nil {
						t.Logf("Warning: %s", err)
						return
					}
					t.Log("defer success")
				}()
			}

			bs := NewBuildService(zaptest.NewLogger(t), BuildEnvironmentConfig{}, store)
			if c.cmdRunner != nil {
				bs.cmdRunner = c.cmdRunner(t, ctrl)
			}

			got, err := bs.Build(context.TODO(), c.files)
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
			require.Equal(t, c.wantResult(c.files), got)
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
			svc := NewBuildService(zaptest.NewLogger(t), cfg, nil)
			got := svc.getEnvironmentVariables()
			c.check(t, c.includedVars, got)
		})
	}
}

func mustArtifactID(t *testing.T, files map[string][]byte) storage.ArtifactID {
	t.Helper()
	a, err := storage.GetArtifactID(files)
	require.NoError(t, err)
	return a
}

func TestBuildError_Error(t *testing.T) {
	msg := "test"
	require.Equal(t, msg, newBuildError(msg).Error())
}
