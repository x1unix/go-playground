package analyzer

import (
	"go/ast"
	"strconv"
	"strings"
)

func formatFieldAndType(t ast.Expr, id *ast.Ident) string {
	typeStr := expToString(t)
	return id.String() + " " + typeStr
}

func formatFieldsList(params *ast.FieldList, joinChar string) (string, int) {
	if params == nil {
		return "", 0
	}

	paramsLen := len(params.List)
	fieldTypePair := make([]string, 0, paramsLen)
	for _, p := range params.List {
		if len(p.Names) == 0 {
			// In case when no named return
			fieldTypePair = append(fieldTypePair, expToString(p.Type))
		}

		// Named return params
		for _, n := range p.Names {
			paramStr := formatFieldAndType(p.Type, n)
			fieldTypePair = append(fieldTypePair, paramStr)
		}
	}

	return strings.Join(fieldTypePair, joinChar), paramsLen
}

func valSpecToItem(isConst bool, v *ast.ValueSpec, withPrivate bool) []*CompletionItem {
	items := make([]*CompletionItem, 0, len(v.Names))
	for _, n := range v.Names {
		if !n.IsExported() {
			if !withPrivate {
				continue
			}
		}

		ci := &CompletionItem{
			Label:         n.String(),
			Documentation: v.Doc.Text(),
			Detail:        n.String(),
			InsertText:    n.String(),
		}

		if isConst {
			ci.Kind = Constant
		} else {
			ci.Kind = Variable
		}

		items = append(items, ci)
	}

	return items
}

func funcToString(fn *ast.FuncType) string {
	params, _ := formatFieldsList(fn.Params, ", ")
	str := "func(" + params + ")"
	returns, retCount := formatFieldsList(fn.Results, ", ")
	switch retCount {
	case 0:
		break
	case 1:
		str += " " + returns
	default:
		str += " (" + returns + ")"
	}

	return str
}

// formatFuncInsertText returns `insertText` snippet template for monaco-editor
// from function signature.
//
// Example:
//
//	func sum(a, b int) int
//
// Will output:
//
//	"sum(${1:a}, ${2:b})"
func formatFuncInsertText(fn *ast.FuncDecl) string {
	sb := strings.Builder{}
	sb.WriteString(fn.Name.String())
	sb.WriteByte('(')

	if fn.Type.Params != nil && fn.Type.Params.List != nil {
		pos := 1 // in monaco, first input argument should start with 0
		params := make([]string, 0, fn.Type.Params.NumFields())

		for _, param := range fn.Type.Params.List {
			if len(param.Names) == 0 {
				// $pos
				params = append(params, "$"+strconv.Itoa(pos))
				pos++
				continue
			}

			for _, p := range param.Names {
				// ${pos:paramName}
				params = append(params, "${"+strconv.Itoa(pos)+":"+p.Name+"}")
				pos++
			}
		}
		sb.WriteString(strings.Join(params, ", "))
	}

	sb.WriteRune(')')
	return sb.String()
}

func funcToItem(fn *ast.FuncDecl) *CompletionItem {
	ci := &CompletionItem{
		Label:           fn.Name.String(),
		Kind:            Function,
		Detail:          funcToString(fn.Type),
		Documentation:   formatDoc(fn.Doc.Text()),
		InsertText:      formatFuncInsertText(fn),
		InsertTextRules: InsertAsSnippet,
	}

	return ci
}
