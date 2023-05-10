package analyzer

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/testutil"
)

func TestPackage_IsBuiltin(t *testing.T) {
	pkg1 := Package{Name: "foo"}
	pkg2 := Package{Name: "builtin"}
	require.False(t, pkg1.IsBuiltin())
	require.True(t, pkg2.IsBuiltin())
}

func TestPackage_GetLocation(t *testing.T) {
	SetRoot("/")
	want := "/src/foo/bar"
	pkg := Package{Path: "foo/bar"}
	require.Equal(t, want, pkg.GetLocation())
}

func TestPackage_SymbolByChar(t *testing.T) {
	funcs := &CompletionItem{Label: "bar", Kind: Function}
	syms := &CompletionItem{Label: "baz", Kind: Constant}

	allFuncs := []*CompletionItem{{Label: "aaaa", Kind: Function}, funcs}
	allSyms := []*CompletionItem{{Label: "xxxx", Kind: Constant}, syms}
	pkg := Package{
		Synopsis: "test doc",
		PackageSummary: PackageSummary{
			Functions: NewSymbolIndex(allFuncs),
			Values:    NewSymbolIndex(allSyms),
		},
	}

	require.Equal(t, MarkdownString{Value: "test doc"}, pkg.documentation())
	wantByChar := []*CompletionItem{funcs, syms}
	gotChar := pkg.SymbolByChar("b")
	require.Equal(t, wantByChar, gotChar)

	wantAll := make([]*CompletionItem, 0, len(allSyms)+len(allFuncs))
	wantAll = append(wantAll, allFuncs...)
	wantAll = append(wantAll, allSyms...)
	gotAll := pkg.AllSymbols()
	require.Equal(t, wantAll, gotAll)
}

func TestPackages_GetCompletionItems(t *testing.T) {
	want := []*CompletionItem{
		{
			Label:         "a",
			Kind:          Module,
			Detail:        "a",
			InsertText:    "a",
			Documentation: MarkdownString{},
		},
		{
			Label:         "b",
			Kind:          Module,
			Detail:        "b",
			InsertText:    "b",
			Documentation: MarkdownString{},
		},
	}

	pkgs := make(Packages, 0, len(want))
	for _, sym := range want {
		pkgs = append(pkgs, &Package{
			Name: sym.Label,
		})
	}

	got := pkgs.GetCompletionItems()
	require.Equal(t, want, got)
}

func TestPackage_HasChildren(t *testing.T) {
	pkg := Package{Children: make([]*Package, 2)}
	require.True(t, pkg.HasChildren())

	pkg.Children = nil
	require.False(t, pkg.HasChildren())
}

func TestPackage_AllSymbols(t *testing.T) {
	SetRoot("testdata")
	SetLogger(testutil.GetLogger(t).Desugar())
	want := examplePackageSummary
	pkg := Package{Path: "example"}
	require.NoError(t, pkg.Analyze())
	require.Equal(t, want, pkg.PackageSummary)
}
