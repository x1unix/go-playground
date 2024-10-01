package index

import (
	"github.com/x1unix/go-playground/internal/pkgindex/docutil"
	"github.com/x1unix/go-playground/pkg/monaco"
	"go/ast"
	"go/parser"
	"go/token"
)

var ignoreBuiltins = docutil.NewIgnoreList(
	"Type", "Type1", "IntegerType", "FloatType", "ComplexType",
)

type sourceSummary struct {
	packageName string
	doc         *ast.CommentGroup
	symbols     []SymbolInfo
}

type fileParseParams struct {
	importPath string
	parseDoc   bool
}

func getFilter(importPath string) docutil.Filter {
	if importPath == docutil.BuiltinPackage {
		return ignoreBuiltins
	}

	return docutil.UnexportedFilter{}
}

func parseFile(fset *token.FileSet, fpath string, params fileParseParams) (*sourceSummary, error) {
	root, err := parser.ParseFile(fset, fpath, nil, parser.ParseComments)
	if err != nil {
		return nil, err
	}

	summary := sourceSummary{
		packageName: root.Name.String(),
		symbols:     make([]SymbolInfo, 0, len(root.Decls)),
	}

	// "go/doc" ignores some packages from GOROOT thus it doesn't work for us.
	// That means, all boring job should be done manually.
	if params.parseDoc && docutil.IsPackageDoc(root.Doc) {
		summary.doc = root.Doc
	}

	src := SymbolSource{
		Name: root.Name.String(),
		Path: params.importPath,
	}

	opts := docutil.TraverseOpts{
		FileSet:       fset,
		Filter:        getFilter(params.importPath),
		SnippetFormat: monaco.InsertAsSnippet,
	}

	err = docutil.CollectCompletionItems(root.Decls, opts, func(items ...monaco.CompletionItem) {
		for _, item := range items {
			summary.symbols = append(summary.symbols, SymbolInfoFromCompletionItem(item, src))
		}
	})

	if err != nil {
		return nil, err
	}

	return &summary, nil
}
