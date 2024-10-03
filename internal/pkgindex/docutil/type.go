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

// TypeToSymbol returns completion item from type declaration inside block.
func TypeToSymbol(fset *token.FileSet, block BlockData, spec *ast.TypeSpec) (Symbol, error) {
	// Block declarations contain doc inside each child.
	item := Symbol{
		Label:         spec.Name.Name,
		Kind:          block.Kind,
		InsertText:    spec.Name.Name,
		Documentation: getTypeDoc(block, spec),
	}

	isPrimitive := false
	switch spec.Type.(type) {
	case *ast.InterfaceType:
		item.Detail = "interface{...}"
		item.Kind = monaco.Interface
	case *ast.StructType:
		// TODO: prefill struct members
		item.Detail = "struct{...}"
		item.InsertText = item.InsertText + "{}"
		item.Kind = monaco.Struct
	case *ast.Ident:
		isPrimitive = true
	}

	if !isPrimitive {
		signature, err := PrintDecl(fset, block.Decl)
		if err != nil {
			return item, fmt.Errorf("%w (type: %q, pos: %s)", err, item.Label, GetDeclPosition(fset, spec))
		}

		item.Signature = signature
	}

	return item, nil
}

func getTypeDoc(block BlockData, spec *ast.TypeSpec) string {
	g := block.Decl.Doc
	if block.IsGroup || len(block.Decl.Specs) > 1 {
		// standalone type declarations are still considered as block.
		g = spec.Doc
	}

	if CommentGroupEmpty(g) {
		return ""
	}

	return string(FormatCommentGroup(g))
}
