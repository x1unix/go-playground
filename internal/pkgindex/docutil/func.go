package docutil

import (
	"go/ast"
	"go/token"
	"strings"

	"github.com/x1unix/go-playground/pkg/monaco"
)

// CompletionItemFromFunc constructs completion item from a function AST declaration.
//
// Function documentation is generated in Markdown format.
func CompletionItemFromFunc(fset *token.FileSet, fn *ast.FuncDecl, snippetFormat monaco.CompletionItemInsertTextRule) (item monaco.CompletionItem, err error) {
	isSnippet := snippetFormat == monaco.InsertAsSnippet
	item = monaco.CompletionItem{
		Kind:            monaco.Function,
		InsertTextRules: snippetFormat,
		InsertText:      buildFuncInsertStatement(fn, isSnippet),
	}

	item.Label.SetString(fn.Name.String())
	item.Documentation.SetValue(&monaco.IMarkdownString{
		Value: string(FormatCommentGroup(fn.Doc)),
	})

	// TODO: ensure that body is removed
	item.Detail, err = DeclToString(fset, fn)
	if err != nil {
		return item, err
	}

	return item, nil
}

func buildFuncInsertStatement(decl *ast.FuncDecl, asSnippet bool) string {
	if !asSnippet {
		return decl.Name.String() + "()"
	}

	// snippet offsets start at 1
	offset := 1

	typ := decl.Type
	sb := new(strings.Builder)
	sb.Grow(defaultStringBuffSize)
	sb.WriteString(decl.Name.String())
	offset = WriteTypeParams(sb, offset, typ.TypeParams)
	sb.WriteString("(")
	WriteParamsList(sb, offset, typ.Params)
	sb.WriteString(")")
	return sb.String()
}
