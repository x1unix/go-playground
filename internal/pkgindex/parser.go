package pkgindex

import (
	"context"
	"fmt"
	"go/parser"
	"go/token"
	"path/filepath"
	"strings"

	"github.com/x1unix/go-playground/internal/analyzer"
	"github.com/x1unix/go-playground/pkg/monaco"
)

const goDocDomain = "pkg.go.dev"

type PackageParseParams struct {
	RootDir    string
	ImportPath string
	Files      []string
}

func (params PackageParseParams) PackagePath() string {
	return filepath.Join(params.RootDir, params.ImportPath)
}

func formatGoDocLink(importPath string) string {
	return fmt.Sprintf("[%[2]s on %[1]s](https://%[1]s/%[2]s)", goDocDomain, importPath)
}

// ParseImportCompletionItem parses a Go package at a given GOROOT and constructs monaco CompletionItem from it.
func ParseImportCompletionItem(ctx context.Context, params PackageParseParams) (result monaco.CompletionItem, error error) {
	pkgPath := params.PackagePath()

	result = monaco.CompletionItem{
		Kind:       monaco.Module,
		Detail:     params.ImportPath,
		InsertText: params.ImportPath,
	}

	docString := formatGoDocLink(params.ImportPath)

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

		// Found a doc string, exit.
		result.Detail = src.Name.String()
		docComment := strings.TrimSpace(analyzer.FormatDocString(doc.Text()).Value)
		docString = docComment + "\n\n" + docString
		break
	}

	result.Label.SetString(params.ImportPath)
	result.Documentation.SetValue(&monaco.IMarkdownString{
		Value:     docString,
		IsTrusted: true,
	})
	return result, nil
}
