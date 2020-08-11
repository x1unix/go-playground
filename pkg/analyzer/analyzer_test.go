package analyzer

import (
	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/testutil"
	"testing"
)

func TestSetLogger(t *testing.T) {
	l := testutil.GetLogger(t).Desugar()
	SetLogger(l)
}

func TestSetRoot(t *testing.T) {
	root := "/go"
	SetRoot(root)
	require.Equal(t, root, goRoot)
}

func TestReadPackagesFile(t *testing.T) {
	cases := map[string]struct {
		file string
		want []*Package
		err  string
	}{
		"valid package": {
			file: "pkg1.json",
			want: []*Package{
				{
					Name:     "time",
					Synopsis: "Package time provides functionality for measuring and displaying time.\n\n[\"time\" on pkg.go.dev](https://pkg.go.dev/time/)",
					URL:      "https://pkg.go.dev/time/",
					Path:     "time",
				},
				{
					Name:     "unicode",
					Synopsis: "Package unicode provides data and functions to test some properties of Unicode code points.\n\n[\"unicode\" on pkg.go.dev](https://pkg.go.dev/unicode/)",
					URL:      "https://pkg.go.dev/unicode/",
					Path:     "unicode",
					Children: []*Package{
						{
							Name:     "utf16",
							Synopsis: "Package utf16 implements encoding and decoding of UTF-16 sequences.\n\n[\"unicode/utf16\" on pkg.go.dev](https://pkg.go.dev/unicode/utf16/)",
							URL:      "https://pkg.go.dev/unicode/utf16/",
							Path:     "unicode/utf16",
						},
						{
							Name:     "utf8",
							Synopsis: "Package utf8 implements functions and constants to support text encoded in UTF-8.\n\n[\"unicode/utf8\" on pkg.go.dev](https://pkg.go.dev/unicode/utf8/)",
							URL:      "https://pkg.go.dev/unicode/utf8/",
							Path:     "unicode/utf8",
						},
					},
				},
			},
		},
		"bad JSON": {
			file: "bad.txt",
			err:  "invalid character",
		},
		"invalid file": {
			file: "foobar",
			err:  "no such file",
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			got, err := ReadPackagesFile(testutil.TestdataPath(c.file))
			if c.err != "" {
				testutil.ContainsError(t, err, c.err)
				return
			}
			require.NoError(t, err)
			require.Equal(t, c.want, got)
		})
	}
}

func TestBuildPackageIndex(t *testing.T) {
	pkgs, err := ReadPackagesFile(testutil.TestdataPath("pkg2.json"))
	require.NoError(t, err)
	index := BuildPackageIndex(pkgs)
	require.Equal(t, pkgs, index.Packages)
	require.Equal(t, len(pkgs), index.Len())

	expectSymbols := make(map[string][]*CompletionItem, len(pkgs))

	for _, pkg := range pkgs {
		got, ok := index.PackageByName(pkg.Name)
		require.True(t, ok)
		require.Equal(t, pkg, got)

		char := string(pkg.Name[0])
		expectSymbols[char] = append(expectSymbols[char], &CompletionItem{
			Label:         pkg.Name,
			Kind:          Module,
			Detail:        pkg.Name,
			Documentation: pkg.documentation(),
			InsertText:    pkg.Name,
		})

		for _, child := range pkg.Children {
			got, ok := index.PackageByName(child.Name)
			require.True(t, ok)
			require.Equal(t, child, got)

			char := string(pkg.Name[0])
			expectSymbols[char] = append(expectSymbols[char], &CompletionItem{
				Label:         child.Name,
				Kind:          Module,
				Detail:        child.Name,
				Documentation: child.documentation(),
				InsertText:    child.Name,
			})
		}
	}

	for char, expect := range expectSymbols {
		match := index.Match(char)
		require.Equal(t, expect, match)
	}
}
