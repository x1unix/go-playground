package imports

import (
	"context"
	"fmt"
	"go/parser"
	"go/token"
	"path/filepath"

	"github.com/x1unix/go-playground/internal/pkgindex/docutil"
	"typefox.dev/lsp"
)

type PackageParseParams struct {
	RootDir    string
	ImportPath string
	Files      []string
}

func (params PackageParseParams) PackagePath() string {
	return filepath.Join(params.RootDir, params.ImportPath)
}

// ParseImportCompletionItem parses a Go package at a given GOROOT and constructs an LSP completion item from it.
func ParseImportCompletionItem(ctx context.Context, params PackageParseParams) (result lsp.CompletionItem, error error) {
	pkgPath := params.PackagePath()

	result = lsp.CompletionItem{
		Kind:       lsp.ModuleCompletion,
		Detail:     params.ImportPath,
		InsertText: params.ImportPath,
	}

	var docString string

	fset := token.NewFileSet()
	for _, fname := range params.Files {
		if err := ctx.Err(); err != nil {
			return result, err
		}

		fpath := filepath.Join(pkgPath, fname)
		src, err := parser.ParseFile(fset, fpath, nil, parser.ParseComments)
		if err != nil {
			return result, fmt.Errorf("failed to parse Go file %q: %s", fpath, err)
		}

		doc := src.Doc
		if doc == nil {
			continue
		}

		result.Detail = src.Name.String()

		// Package doc should start with "Package xxx", see issue #367.
		if docutil.IsPackageDoc(doc) {
			docString = docutil.BuildPackageDoc(doc, params.ImportPath)
			break
		}
	}

	if docString == "" {
		docString = docutil.EmptyPackageDoc(params.ImportPath)
	}

	result.Label = params.ImportPath
	result.Documentation = &lsp.Or_CompletionItem_documentation{Value: lsp.MarkupContent{
		Kind:  lsp.Markdown,
		Value: docString,
	}}
	return result, nil
}
