package docutil

import (
	"fmt"
	"go/ast"
	"go/token"

	"github.com/x1unix/go-playground/pkg/monaco"
)

// BlockData contains information about declaration group.
type BlockData struct {
	IsGroup bool
	Decl    *ast.GenDecl
	Kind    monaco.CompletionItemKind
}

// NewBlockData parses block data from AST block declaration node.
//
// Example:
//
//	var (
//		foo = 1
//		bar = "bar"
//	)
//
//	type (
//		foo int
//		bar struct{}
//	)
func NewBlockData(specGroup *ast.GenDecl) (BlockData, error) {
	blockKind, ok := TokenToCompletionItemKind(specGroup.Tok)
	if !ok {
		return BlockData{}, fmt.Errorf("unsupported declaration token %q", specGroup.Tok)
	}

	return BlockData{
		Decl:    specGroup,
		Kind:    blockKind,
		IsGroup: len(specGroup.Specs) > 1,
	}, nil
}

// TypeToCompletionItem returns completion item from type declaration inside block.
func TypeToCompletionItem(fset *token.FileSet, block BlockData, spec *ast.TypeSpec) (monaco.CompletionItem, error) {
	// Block declarations contain doc inside each child.
	doc := getTypeDoc(block, spec)

	item := monaco.CompletionItem{
		Kind:       block.Kind,
		InsertText: spec.Name.Name,
	}
	item.Label.String = spec.Name.Name

	isPrimitive := false
	switch spec.Type.(type) {
	case *ast.InterfaceType:
		item.Kind = monaco.Interface
	case *ast.StructType:
		// TODO: prefill struct members
		item.InsertText = item.InsertText + "{}"
		item.Kind = monaco.Struct
	case *ast.Ident:
		isPrimitive = true
	}

	if !isPrimitive {
		signature, err := DeclToString(fset, block.Decl)
		if err != nil {
			return item, fmt.Errorf("%w (type: %q, pos: %s)", err, item.Label.String, GetDeclPosition(fset, spec))
		}

		item.Detail = signature
	}

	item.Documentation.SetValue(doc)
	return item, nil
}

func getTypeDoc(block BlockData, spec *ast.TypeSpec) *monaco.IMarkdownString {
	g := block.Decl.Doc
	if block.IsGroup || len(block.Decl.Specs) > 1 {
		// standalone type declarations are still considered as block.
		g = spec.Doc
	}

	if CommentGroupEmpty(g) {
		return nil
	}

	return &monaco.IMarkdownString{
		Value: string(FormatCommentGroup(g)),
	}
}
