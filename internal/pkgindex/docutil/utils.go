package docutil

import (
	"fmt"
	"go/ast"
	"go/printer"
	"go/token"
	"reflect"
	"strconv"
	"strings"

	"github.com/x1unix/go-playground/pkg/monaco"
)

const defaultStringBuffSize = 64

const BuiltinPackage = "builtin"

var (
	astDocFields     = []string{"Doc", "Comment"}
	commentBlockType = reflect.TypeOf((*ast.CommentGroup)(nil))

	token2KindMapping = map[token.Token]monaco.CompletionItemKind{
		token.VAR:   monaco.Variable,
		token.CONST: monaco.Constant,
		token.TYPE:  monaco.Class,
	}
)

// TokenToCompletionItemKind maps Go AST token to monaco's completion item kind.
func TokenToCompletionItemKind(tok token.Token) (monaco.CompletionItemKind, bool) {
	k, ok := token2KindMapping[tok]
	return k, ok
}

// IsGoSourceFile returns whether a file name is a Go source file.
//
// Returns false for unit test files (this is intentional behavior).
func IsGoSourceFile(name string) bool {
	return strings.HasSuffix(name, ".go") && !strings.HasSuffix(name, "_test.go")
}

// CommentGroupEmpty checks whether passed command group is empty.
func CommentGroupEmpty(g *ast.CommentGroup) bool {
	return g == nil || len(g.List) == 0
}

// GetDeclRange returns AST node range in document.
func GetDeclRange(fset *token.FileSet, decl ast.Decl) (start token.Position, end token.Position) {
	f := fset.File(decl.Pos())

	start = f.Position(decl.Pos())
	end = f.Position(decl.End())
	return start, end
}

type Positioner interface {
	Pos() token.Pos
}

// GetDeclPosition returns start position of an AST node
func GetDeclPosition(fset *token.FileSet, decl Positioner) token.Position {
	return OffsetToPosition(fset, decl.Pos())
}

// OffsetToPosition translates offset into position with column and line number.
func OffsetToPosition(fset *token.FileSet, pos token.Pos) token.Position {
	f := fset.File(pos)
	return f.Position(pos)
}

// WriteTypeParams writes type parameters snippet template into a specified buffer.
//
// Snippet offset is a start index for snippet template variables (`$n`) to fill parameters.
func WriteTypeParams(sb *strings.Builder, snippetIndex int, typeParams *ast.FieldList) int {
	if typeParams == nil || len(typeParams.List) == 0 {
		return snippetIndex
	}

	sb.WriteRune('[')
	offset := WriteParamsList(sb, snippetIndex, typeParams)
	sb.WriteRune(']')
	return offset
}

// WriteParamsList writes parameters list template (usually func args) into a specified buffer.
//
// Snippet offset is a start index for snippet template variables (`$n`) to fill parameters.
func WriteParamsList(sb *strings.Builder, snippetIndex int, params *ast.FieldList) int {
	if params == nil || len(params.List) == 0 {
		return snippetIndex
	}

	offset := snippetIndex
	for i, arg := range params.List {
		if i > 0 {
			sb.WriteString(", ")
		}

		for j, n := range arg.Names {
			if j > 0 {
				sb.WriteString(", ")
			}

			sb.WriteString("${")
			sb.WriteString(strconv.Itoa(offset))
			sb.WriteRune(':')
			sb.WriteString(n.String())
			sb.WriteRune('}')
			offset++
		}
	}

	return offset
}

// PrintDecl returns string representation of passed AST node.
func PrintDecl(fset *token.FileSet, decl any) (string, error) {
	// Remove comments block from AST node to keep only node body
	trimmedDecl := removeCommentFromDecl(decl)

	sb := new(strings.Builder)
	sb.Grow(defaultStringBuffSize)
	err := printer.Fprint(sb, fset, trimmedDecl)
	if err != nil {
		return "", fmt.Errorf("can't generate type signature out of AST node %T: %w", trimmedDecl, err)
	}

	return sb.String(), nil
}

func removeCommentFromDecl(decl any) any {
	val := reflect.ValueOf(decl)
	isPtr := val.Kind() == reflect.Pointer
	if isPtr {
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return decl
	}

	dst := reflect.New(val.Type()).Elem()
	dst.Set(val)

	// *ast.FuncDecl, *ast.Object have Doc
	// *ast.Object and *ast.Indent might have Comment
	for _, fieldName := range astDocFields {
		field, ok := val.Type().FieldByName(fieldName)
		if ok && field.Type.AssignableTo(commentBlockType) {
			dst.FieldByIndex(field.Index).SetZero()
		}
	}

	if isPtr {
		dst = dst.Addr()
	}

	return dst.Interface()
}
