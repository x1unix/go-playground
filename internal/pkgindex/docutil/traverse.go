package docutil

import (
	"fmt"
	"go/ast"
	"go/token"
	"log"

	"github.com/x1unix/go-playground/pkg/monaco"
)

type TraverseOpts struct {
	Filter        Filter
	FileSet       *token.FileSet
	SnippetFormat monaco.CompletionItemInsertTextRule
}

// CollectSymbols traverses root file declarations and transforms them into completion items.
//
// Important: type methods are ignored.
func CollectSymbols(decls []ast.Decl, opts TraverseOpts, collector Collector) (count int, err error) {
	filter := filterOrDefault(opts.Filter)
	for _, decl := range decls {
		switch t := decl.(type) {
		case *ast.FuncDecl:
			if filter.Ignore(t.Name.String()) {
				continue
			}

			if t.Recv != nil {
				// Ignore type methods, at-least for now.
				continue
			}

			item, err := SymbolFromFunc(opts.FileSet, t, monaco.InsertAsSnippet)
			if err != nil {
				return count, fmt.Errorf(
					"can't parse function %s: %w (pos: %s)",
					t.Name.String(), err, GetDeclPosition(opts.FileSet, t),
				)
			}

			count++
			collector.CollectSymbol(item)
		case *ast.GenDecl:
			if t.Tok == token.IMPORT {
				continue
			}

			n, err := CollectDecls(opts.FileSet, t, filter, collector)
			if err != nil {
				return count, fmt.Errorf(
					"can't parse decl %s: %w (at %s)",
					t.Tok, err, GetDeclPosition(opts.FileSet, t),
				)
			}

			count += n
		default:
			fname := opts.FileSet.File(decl.Pos()).Name()
			log.Printf(
				"Warning: unsupported block %T at %s:%s",
				t, fname, GetDeclPosition(opts.FileSet, decl),
			)
		}
	}

	return count, nil
}
