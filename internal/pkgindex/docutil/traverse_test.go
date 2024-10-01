package docutil

import (
	"encoding/json"
	"go/parser"
	"go/token"
	"golang.org/x/exp/slices"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/monaco"
)

func TestTypeToCompletionItem(t *testing.T) {
	cases := map[string]struct {
		filePath   string
		expectFile string
		expectErr  string
		dumpOnly   bool
		ignore     []string
	}{
		//"bufio": {
		//	filePath: "testdata/bufio/bufio.go",
		//},
		"simple": {
			dumpOnly:   true,
			filePath:   "testdata/simple/types.go",
			expectFile: "testdata/simple/expect.json",
		},
		"builtin": {
			ignore: []string{
				"Type", "Type1", "IntegerType", "FloatType", "ComplexType",
			},
			filePath:   "testdata/builtin/builtin.go",
			expectFile: "testdata/builtin/expect.json",
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			fset := token.NewFileSet()

			r, err := parser.ParseFile(fset, c.filePath, nil, parser.ParseComments)
			require.NoError(t, err)

			opts := TraverseOpts{
				FileSet:       fset,
				SnippetFormat: monaco.InsertAsSnippet,
			}
			if len(c.ignore) > 0 {
				opts.Filter = NewIgnoreList(c.ignore...)
			}

			var (
				got  []monaco.CompletionItem
				want []monaco.CompletionItem
			)
			err = CollectCompletionItems(r.Decls, opts, func(items ...monaco.CompletionItem) {
				got = append(got, items...)
			})
			if c.expectErr != "" {
				require.Error(t, err)
				require.Contains(t, err.Error(), c.expectErr)
				return
			}

			require.NoError(t, err)

			if c.dumpOnly {
				// for debug
				dumpCompletionItems(t, got, c.expectFile)
				return
			}

			f, err := os.Open(c.expectFile)
			require.NoError(t, err)
			t.Cleanup(func() {
				_ = f.Close()
			})

			require.NoError(t, json.NewDecoder(f).Decode(&want))
			slices.SortFunc(got, func(a, b monaco.CompletionItem) bool {
				return strings.Compare(a.Label.String, b.Label.String) == -1
			})
			slices.SortFunc(want, func(a, b monaco.CompletionItem) bool {
				return strings.Compare(a.Label.String, b.Label.String) == -1
			})

			require.Equal(t, want, got)
		})
	}
}

func dumpCompletionItems(t *testing.T, items []monaco.CompletionItem, dst string) {
	f, err := os.OpenFile(dst, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0644)
	require.NoError(t, err)
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	_ = enc.Encode(items)
}
