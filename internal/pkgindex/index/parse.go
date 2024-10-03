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

type CollectFn = func(src SymbolSource, sym docutil.Symbol)

type sourceSummary struct {
	packageName  string
	symbolsCount int
	doc          *ast.CommentGroup
}

type fileParseParams struct {
	importPath string
	parseDoc   bool
	collector  CollectFn
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

	collector := docutil.CollectorFunc(func(sym docutil.Symbol) {
		params.collector(src, sym)
	})

	opts := docutil.TraverseOpts{
		FileSet:       fset,
		Filter:        getFilter(params.importPath),
		SnippetFormat: monaco.InsertAsSnippet,
	}

	summary.symbolsCount, err = docutil.CollectSymbols(root.Decls, opts, collector)

	if err != nil {
		return nil, err
	}

	return &summary, nil
}
