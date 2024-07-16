package pkgindex

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/monaco"
)

func TestParseImportCompletionItem(t *testing.T) {
	cases := map[string]struct {
		pkgName          string
		customGoRoot     string
		expectErr        string
		filterInputFiles bool
		getContext       func() context.Context
		expect           func(importPath string) monaco.CompletionItem
		compareFunc      func(t *testing.T, got monaco.CompletionItem)
	}{
		"package with documentation": {
			pkgName: "foopkg/pkgbar",
			expect: func(importPath string) monaco.CompletionItem {
				ret := monaco.CompletionItem{
					InsertText: importPath,
					Kind:       monaco.Module,
					Detail:     "pkgbar",
				}

				ret.Label.SetString(importPath)
				ret.Documentation.SetValue(&monaco.IMarkdownString{
					IsTrusted: true,
					Value: "Package pkgbar is a stub package for a test.\n\n" +
						fmt.Sprintf("[%[2]s on %[1]s](https://%[1]s/%[2]s)", goDocDomain, importPath),
				})
				return ret
			},
		},
		"package without any documentation": {
			pkgName: "foopkg/emptypkg",
			expect: func(importPath string) monaco.CompletionItem {
				ret := monaco.CompletionItem{
					InsertText: importPath,
					Kind:       monaco.Module,
					Detail:     importPath,
				}

				ret.Label.SetString(importPath)
				ret.Documentation.SetValue(&monaco.IMarkdownString{
					IsTrusted: true,
					Value:     fmt.Sprintf("[%[2]s on %[1]s](https://%[1]s/%[2]s)", goDocDomain, importPath),
				})
				return ret
			},
		},
		"package with bad files": {
			pkgName:   "badpkg",
			expectErr: "failed to parse Go file",
		},
		"canceled context": {
			pkgName:   "foopkg/pkgbar",
			expectErr: context.Canceled.Error(),
			getContext: func() context.Context {
				ctx, cancelFn := context.WithCancel(context.TODO())
				cancelFn()

				return ctx
			},
		},
		"367-syscall-invalid-description": {
			customGoRoot:     mustGetGoRoot(t) + "/src",
			pkgName:          "syscall",
			filterInputFiles: true,
			compareFunc: func(t *testing.T, got monaco.CompletionItem) {
				expectPfx := "Package syscall contains an interface to the low-level"
				expectStartWith(t, got.Documentation.Value.Value, expectPfx)
			},
		},
	}

	const rootDir = "testdata"
	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			ctx := context.TODO()
			if c.getContext != nil {
				ctx = c.getContext()
			}

			goRoot := rootDir
			if c.customGoRoot != "" {
				goRoot = c.customGoRoot
			}

			result, err := ParseImportCompletionItem(ctx, PackageParseParams{
				RootDir:    goRoot,
				ImportPath: c.pkgName,
				Files:      findDirFiles(t, goRoot, c.pkgName, c.filterInputFiles),
			})
			if c.expectErr != "" {
				require.Error(t, err)
				require.Contains(t, err.Error(), c.expectErr)
				return
			}

			require.NoError(t, err)
			if c.compareFunc != nil {
				c.compareFunc(t, result)
				return
			}

			expect := c.expect(c.pkgName)
			require.Equal(t, expect, result)
		})
	}
}

func findDirFiles(t *testing.T, dir, pkgName string, filterFiles bool) []string {
	t.Helper()
	entries, err := os.ReadDir(filepath.Join(dir, pkgName))
	require.NoError(t, err)

	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		if filterFiles {
			if strings.HasSuffix(name, "_test.go") || !strings.HasSuffix(name, ".go") {
				continue
			}
		}

		files = append(files, name)
	}

	return files
}

func mustGetGoRoot(t *testing.T) string {
	t.Helper()
	v, err := ResolveGoRoot()
	require.NoError(t, err)
	return v
}

func expectStartWith(t *testing.T, str string, pfx string) {
	require.Truef(t, strings.HasPrefix(str, pfx), "string %q should start with %q", str, pfx)
}
