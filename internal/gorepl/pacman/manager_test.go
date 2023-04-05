package pacman

import (
	"context"
	"encoding/json"
	"golang.org/x/mod/module"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

type testdataPkgCache struct {
	testDir  string
	pkgFile  string
	pkgCache map[string]*module.Version
}

func newTestdataPkgCache(testDir string) *testdataPkgCache {
	return &testdataPkgCache{
		testDir: testDir,
		pkgFile: filepath.Join(testDir, "index.json"),
	}
}

func (w *testdataPkgCache) pullPackages() {
	if w.pkgCache != nil {
		return
	}

	w.pkgCache = make(map[string]*module.Version)
	data, err := os.ReadFile(filepath.Join(filepath.Join(w.testDir, "pkg", "")))
	if os.IsNotExist(err) {
		return
	}
	if err != nil {
		log.Println("Readfile error:", err)
	}

	_ = json.Unmarshal(data, &w.pkgCache)
	return
}

func (w *testdataPkgCache) commitPackages() {
	data, _ := json.MarshalIndent(w.pkgCache, "", "  ")
	_ = os.WriteFile(w.pkgFile, data, 0644)
}

func (w *testdataPkgCache) RegisterPackage(pkg *module.Version) error {
	w.pullPackages()
	w.pkgCache[pkg.Path] = pkg
	return nil
}

func (w *testdataPkgCache) LookupPackage(pkgName string) (*module.Version, error) {
	w.pullPackages()
	pkg, ok := w.pkgCache[pkgName]
	if !ok {
		return nil, fs.ErrNotExist
	}

	return pkg, nil
}

func (w *testdataPkgCache) RemovePackage(pkg *module.Version) error {
	return os.RemoveAll(filepath.Join(w.testDir, pkg.Path))
}

func (w *testdataPkgCache) TestImportPath(name string) error {
	filePath := filepath.Join(w.testDir, name)
	log.Println("TestImportPath", filePath)
	_, err := os.Stat(filePath)
	if err != nil {
		return err
	}

	return nil
}

func (w *testdataPkgCache) WritePackageFile(pkg *module.Version, filePath string, src fs.File) error {
	// Keep packages in the same structure as GOPATH without version suffix.
	// Same packages of different versions are not supported.
	filePath = removeVersionFromPath(pkg, filePath)

	absFilePath := filepath.Join(w.testDir, filePath)
	if err := os.MkdirAll(filepath.Dir(absFilePath), 0755); err != nil {
		return err
	}

	f, err := os.OpenFile(absFilePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}

	defer f.Close()
	_, err = io.Copy(f, src)
	return err
}

func TestPackageManager_CheckDependencies(t *testing.T) {
	cwd, err := os.Getwd()
	require.NoError(t, err)

	client := goproxy.NewClient(http.DefaultClient, "https://proxy.golang.org")
	ctx := context.Background()
	pkgCache := newTestdataPkgCache(filepath.Join(cwd, "testdata", "pkg"))
	t.Cleanup(func() {
		pkgCache.commitPackages()
	})

	pkgmgr := NewPackageManager(client, pkgCache)
	err = pkgmgr.CheckDependencies(ctx, []string{
		"go.uber.org/zap",
		"golang.org/x/tools/internal/imports",
	})

	require.NoError(t, err)
}

func TestGuessPackageNameFromImport(t *testing.T) {
	cases := map[string]struct {
		path   string
		expect string
	}{
		"too short": {
			path: "github.com",
		},
		"unknown": {
			path: "rsc.io/quote",
		},
		"github - too short": {
			path: "github.com/foobar",
		},
		"github - already valid": {
			path:   "github.com/foo/bar",
			expect: "github.com/foo/bar",
		},
		"github - regular import": {
			path:   "github.com/foo/bar/pkg/internal/test",
			expect: "github.com/foo/bar",
		},
		"github - import with tag": {
			path:   "github.com/foo/bar/v2/pkg/internal/test",
			expect: "github.com/foo/bar/v2",
		},
		"gopkgin - short unchanged": {
			path:   "gopkg.in/check.v1",
			expect: "gopkg.in/check.v1",
		},
		"gopkgin - long unchanged": {
			path:   "gopkg.in/fatih/pool.v2",
			expect: "gopkg.in/fatih/pool.v2",
		},
		"gopkgin - short": {
			path:   "gopkg.in/check.v1/foobar/baz",
			expect: "gopkg.in/check.v1",
		},
		"gopkgin - long": {
			path:   "gopkg.in/fatih/pool.v2/foobar/baz",
			expect: "gopkg.in/fatih/pool.v2",
		},
		"golang-org - experimental unchanged": {
			path:   "golang.org/x/sys",
			expect: "golang.org/x/sys",
		},
		"golang-org - experimental": {
			path:   "golang.org/x/sys/windows",
			expect: "golang.org/x/sys",
		},
		"golang-org - unknown": {
			path: "golang.org/foobar",
		},
		"google-golang-org": {
			path:   "google.golang.org/api/foobar/baz",
			expect: "google.golang.org/api",
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			got, ok := guessPackageNameFromImport(c.path)
			if c.expect == "" {
				require.False(t, ok)
				return
			}

			require.True(t, ok)
			require.Equal(t, c.expect, got)
		})
	}
}
