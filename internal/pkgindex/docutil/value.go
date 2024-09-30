package docutil

import (
	"fmt"
	"go/ast"
	"go/token"

	"github.com/x1unix/go-playground/pkg/monaco"
)

// ValueToCompletionItem constructs completion item from value declaration.
//
// Able to handle special edge cases for builtin declarations.
func ValueToCompletionItem(fset *token.FileSet, block BlockData, spec *ast.ValueSpec, allowUnexported bool) ([]monaco.CompletionItem, error) {
	var blockDoc *monaco.IMarkdownString
	if !block.IsGroup {
		blockDoc = &monaco.IMarkdownString{
			Value: string(FormatCommentGroup(spec.Doc)),
		}
	}

	items := make([]monaco.CompletionItem, 0, len(spec.Values))
	for _, val := range spec.Names {
		if !val.IsExported() && !allowUnexported {
			continue
		}

		item := monaco.CompletionItem{
			Kind:       block.Kind,
			InsertText: val.Name,
		}

		item.Label.String = val.Name
		item.Documentation.SetValue(blockDoc)

		switch val.Name {
		case "true", "false":
			// TODO: handle builtins
		default:
			signature, err := DeclToString(fset, val.Obj.Decl)
			if err != nil {
				return nil, fmt.Errorf(
					"%w (value name: %s, pos: %s)", err, val.Name, GetDeclPosition(fset, val),
				)
			}

			// declaration type is not present in value block.
			if signature != "" {
				signature = block.Decl.Tok.String() + " " + signature
			}

			item.Detail = signature
		}

		items = append(items, item)
	}

	return items, nil
}
