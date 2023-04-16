package pacman

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

func TestPackageManager_CheckDependencies(t *testing.T) {
	cwd, err := os.Getwd()
	require.NoError(t, err)

	client := goproxy.NewClient(http.DefaultClient, "https://proxy.golang.org")
	ctx := context.Background()

	testDir := filepath.Join(cwd, "testdata", "pkg")
	pkgIndex := NewMemoryPackageIndex()
	testFS := NewHostFS()
	pkgCache := NewSimpleFSCache(testDir, testFS, pkgIndex)

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
