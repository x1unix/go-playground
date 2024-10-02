package docutil

import (
	"fmt"
	"go/ast"
	"go/token"
)

// CollectDecls collects symbols from generic type of value spec.
func CollectDecls(fset *token.FileSet, specGroup *ast.GenDecl, filter Filter, collector Collector) (count int, err error) {
	if len(specGroup.Specs) == 0 {
		return 0, nil
	}

	filter = filterOrDefault(filter)
	block, err := NewBlockData(specGroup)
	if err != nil {
		return 0, err
	}

	traverseCtx := TraverseContext{
		FileSet: fset,
		Block:   block,
		Filter:  filter,
	}

	for _, spec := range specGroup.Specs {
		switch t := spec.(type) {
		case *ast.TypeSpec:
			if filter.Ignore(t.Name.String()) {
				continue
			}

			item, err := TypeToSymbol(fset, block, t)
			if err != nil {
				return count, err
			}

			count++
			collector.CollectSymbol(item)
		case *ast.ValueSpec:
			n, err := CollectValues(traverseCtx, t, collector)
			if err != nil {
				return count, err
			}

			count += n
		default:
			return count, fmt.Errorf("unsupported declaration type %T", t)
		}
	}

	return count, nil
}
