package docutil

import (
	"fmt"
	"github.com/x1unix/go-playground/pkg/monaco"
	"go/ast"
	"go/token"
)

func DeclToCompletionItem(fset *token.FileSet, specGroup *ast.GenDecl, filter Filter) ([]monaco.CompletionItem, error) {
	if len(specGroup.Specs) == 0 {
		return nil, nil
	}

	filter = filterOrDefault(filter)
	block, err := NewBlockData(specGroup)
	if err != nil {
		return nil, err
	}

	traverseCtx := TraverseContext{
		FileSet: fset,
		Block:   block,
		Filter:  filter,
	}

	completions := make([]monaco.CompletionItem, 0, len(specGroup.Specs))
	for _, spec := range specGroup.Specs {
		switch t := spec.(type) {
		case *ast.TypeSpec:
			if filter.Ignore(t.Name.String()) {
				continue
			}

			item, err := TypeToCompletionItem(fset, block, t)
			if err != nil {
				return nil, err
			}

			completions = append(completions, item)
		case *ast.ValueSpec:
			items, err := ValueToCompletionItem(traverseCtx, t)
			if err != nil {
				return nil, err
			}

			if len(items) == 0 {
				continue
			}

			completions = append(completions, items...)
		default:
			return nil, fmt.Errorf("unsupported declaration type %T", t)
		}
	}

	return completions, nil
}
