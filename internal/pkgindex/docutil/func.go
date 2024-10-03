package docutil

import (
	"go/ast"
	"go/token"
	"strings"

	"github.com/x1unix/go-playground/pkg/monaco"
)

// SymbolFromFunc constructs completion item from a function AST declaration.
//
// Function documentation is generated in Markdown format.
func SymbolFromFunc(fset *token.FileSet, fn *ast.FuncDecl, snippetFormat monaco.CompletionItemInsertTextRule) (item Symbol, err error) {
	isSnippet := snippetFormat == monaco.InsertAsSnippet
	item = Symbol{
		Label:           fn.Name.String(),
		Kind:            monaco.Function,
		InsertTextRules: snippetFormat,
		InsertText:      buildFuncInsertStatement(fn, isSnippet),
		Documentation:   string(FormatCommentGroup(fn.Doc)),
	}

	item.Detail, err = PrintFuncAnonymous(fset, fn)
	if err != nil {
		return item, err
	}

	item.Signature, err = PrintFuncPrototype(fset, fn)
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

// PrintFuncPrototype returns function string representation without its body.
func PrintFuncPrototype(fset *token.FileSet, decl *ast.FuncDecl) (string, error) {
	// drop body from func
	fn := *decl
	fn.Body = nil
	return PrintDecl(fset, &fn)
}

// PrintFuncAnonymous similar to PrintFuncPrototype, but omits function name.
func PrintFuncAnonymous(fset *token.FileSet, decl *ast.FuncDecl) (string, error) {
	return PrintDecl(fset, decl.Type)
}
