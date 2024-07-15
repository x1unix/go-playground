package pkgindex

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/monaco"
)

func TestParseImportCompletionItem(t *testing.T) {
	cases := map[string]struct {
		pkgName    string
		expectErr  string
		getContext func() context.Context
		expect     func(importPath string) monaco.CompletionItem
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
	}

	const rootDir = "testdata"
	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			ctx := context.TODO()
			if c.getContext != nil {
				ctx = c.getContext()
			}

			result, err := ParseImportCompletionItem(ctx, PackageParseParams{
				RootDir:    rootDir,
				ImportPath: c.pkgName,
				Files:      findDirFiles(t, rootDir, c.pkgName),
			})
			if c.expectErr != "" {
				require.Error(t, err)
				require.Contains(t, err.Error(), c.expectErr)
				return
			}

			expect := c.expect(c.pkgName)
			require.NoError(t, err)
			require.Equal(t, expect, result)
		})
	}
}

func findDirFiles(t *testing.T, dir, pkgName string) []string {
	t.Helper()
	entries, err := os.ReadDir(filepath.Join(dir, pkgName))
	require.NoError(t, err)

	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		files = append(files, entry.Name())
	}

	return files
}
