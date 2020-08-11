package analyzer

import (
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/testutil"
)

// should be in sync with "testdata/src" !!!
var examplePackageSummary = PackageSummary{
	Functions: newSymbolIndex([]*CompletionItem{
		{
			Label:      "SomeFunc",
			Kind:       Function,
			Detail:     "func(val string) string",
			InsertText: "SomeFunc()",
			Documentation: NewMarkdownString(
				"SomeFunc is test function sample\nwith doc that contains code sample:" +
					"\n\n```\n\ta := \"foo\"\n\tfmt.PrintLn(a)\n\n```\nend\n\n",
			),
		},
		{
			Label:         "ChanArrFunc",
			Kind:          Function,
			Detail:        "func(items ...string) chan string",
			InsertText:    "ChanArrFunc()",
			Documentation: NewMarkdownString("ChanArrFunc is stub\n\n"),
		},
		{
			Label:         "SomeFunc2",
			Kind:          Function,
			Detail:        "func(m map[string]interface{}, v *int) []interface{}",
			InsertText:    "SomeFunc2()",
			Documentation: NewMarkdownString("SomeFunc2 is func stub\n\n"),
		},
		{
			Label:         "IfaceFunc",
			Kind:          Function,
			Detail:        "func() Action",
			InsertText:    "IfaceFunc()",
			Documentation: NewMarkdownString("IfaceFunc is stub with unterminated code block\n```\n\t2 + 2\n\n```\n"),
		},
		{
			Label:         "FuncReturnFuncAndIface",
			Kind:          Function,
			Detail:        "func() (func() (string, error), interface{\nf func()\n})",
			InsertText:    "FuncReturnFuncAndIface()",
			Documentation: NewMarkdownString("FuncReturnFuncAndIface is stub\n\n"),
		},
	}),
	Values: newSymbolIndex([]*CompletionItem{
		{
			Label:         "SomeConst",
			Kind:          Constant,
			Detail:        "SomeConst",
			Documentation: "",
			InsertText:    "SomeConst",
		},
		{
			Label:         "SomeVar",
			Kind:          Variable,
			Detail:        "SomeVar",
			Documentation: "SomeVar is public var example\n",
			InsertText:    "SomeVar",
		},
		{
			Label:         "AnonIfaceVar",
			Kind:          Variable,
			Detail:        "AnonIfaceVar",
			Documentation: "AnonIfaceVar is var with anonymous interface sample\n",
			InsertText:    "AnonIfaceVar",
		},
	}),
}

func TestPackageScanner_Scan(t *testing.T) {
	want := examplePackageSummary
	tempRoot := testutil.TestdataPath("src")
	SetLogger(testutil.GetLogger(t).Desugar())
	s := NewPackageScanner("example", filepath.Join(tempRoot, "example"), false)
	got, err := s.Scan()
	require.NoError(t, err)
	require.Equal(t, want, got)
}
