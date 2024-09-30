package imports

import (
	"context"
	"fmt"
	"go/parser"
	"go/token"
	"path/filepath"

	"github.com/x1unix/go-playground/internal/pkgindex/docutil"
	"github.com/x1unix/go-playground/pkg/monaco"
)

type PackageParseParams struct {
	RootDir    string
	ImportPath string
	Files      []string
}

func (params PackageParseParams) PackagePath() string {
	return filepath.Join(params.RootDir, params.ImportPath)
}

// ParseImportCompletionItem parses a Go package at a given GOROOT and constructs monaco CompletionItem from it.
func ParseImportCompletionItem(ctx context.Context, params PackageParseParams) (result monaco.CompletionItem, error error) {
	pkgPath := params.PackagePath()

	result = monaco.CompletionItem{
		Kind:       monaco.Module,
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

	result.Label.SetString(params.ImportPath)
	result.Documentation.SetValue(&monaco.IMarkdownString{
		Value:     docString,
		IsTrusted: true,
	})
	return result, nil
}
