package docutil

import (
	"fmt"
	"go/ast"
	"go/token"

	"github.com/x1unix/go-playground/pkg/monaco"
)

type TraverseContext struct {
	FileSet *token.FileSet
	Block   BlockData
	Filter  Filter
}

// ValueToCompletionItem constructs completion item from value declaration.
//
// Able to handle special edge cases for builtin declarations.
func ValueToCompletionItem(ctx TraverseContext, spec *ast.ValueSpec) ([]monaco.CompletionItem, error) {
	filter := filterOrDefault(ctx.Filter)
	blockDoc := getValueDocumentation(ctx.Block, spec)

	items := make([]monaco.CompletionItem, 0, len(spec.Values))
	for _, val := range spec.Names {
		if filter.Ignore(val.Name) {
			continue
		}

		detail, err := detailFromIdent(ctx.FileSet, ctx.Block, val)
		if err != nil {
			return nil, err
		}

		item := monaco.CompletionItem{
			Kind:       ctx.Block.Kind,
			InsertText: val.Name,
			Detail:     detail,
		}

		item.Label.String = val.Name
		item.Documentation.SetValue(blockDoc)
		items = append(items, item)
	}

	return items, nil
}

func getValueDocumentation(block BlockData, spec *ast.ValueSpec) *monaco.IMarkdownString {
	g := block.Decl.Doc
	if block.IsGroup || len(block.Decl.Specs) > 1 || CommentGroupEmpty(g) {
		g = spec.Doc
	}

	if CommentGroupEmpty(g) {
		return nil
	}

	return &monaco.IMarkdownString{
		Value: string(FormatCommentGroup(g)),
	}
}

func detailFromIdent(fset *token.FileSet, block BlockData, ident *ast.Ident) (string, error) {
	valDecl, ok := isIdentPrintable(ident)
	if !ok {
		return "", nil
	}

	signature, err := PrintDecl(fset, valDecl)
	if err != nil {
		return "", fmt.Errorf(
			"%w (value name: %s, pos: %s)", err, ident.Name, GetDeclPosition(fset, ident),
		)
	}

	if signature != "" {
		signature = block.Decl.Tok.String() + " " + signature
	}

	return signature, nil
}

// isIdentPrintable checks whether completion item detail can be
// generated from identifier.
//
// Returns stripped, save to print version of identifier value on success.
//
// Returns true if identifier has type definition, scalar value or is from "builtin" package.
func isIdentPrintable(ident *ast.Ident) (any, bool) {
	switch ident.Name {
	case "true", "false":
		// Edge case: builtin package.
		return ident.Obj.Decl, true
	}

	// Permit only value declarations
	val, ok := ident.Obj.Decl.(*ast.ValueSpec)
	if !ok {
		return nil, false
	}

	// Allow identifier with type
	isScalar := true
	for _, spec := range val.Values {
		if _, ok := spec.(*ast.BasicLit); !ok {
			isScalar = false
			break
		}
	}

	if isScalar {
		return ident.Obj.Decl, true
	}

	// Allow typed identifiers, but strip value
	// Return type should be a pointer in order to satisfy printer interfaces.
	if val.Type != nil {
		modifiedVal := *val
		modifiedVal.Values = nil
		return &modifiedVal, true
	}

	return nil, false
}
