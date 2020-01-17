package analyzer

import (
	"go/ast"
	"strings"
)

func formatFieldAndType(t ast.Expr, id *ast.Ident) string {
	typeStr := expToString(t)
	return id.String() + " " + typeStr
}

func formatFuncParams(params *ast.FieldList) (string, int) {
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

	return strings.Join(fieldTypePair, ", "), paramsLen
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

func funcToItem(fn *ast.FuncDecl) *CompletionItem {
	ci := &CompletionItem{
		Label:         fn.Name.String(),
		Kind:          Function,
		Documentation: fn.Doc.Text(),
	}

	params, _ := formatFuncParams(fn.Type.Params)
	ci.Detail = "func(" + params + ")"
	ci.InsertText = ci.Label + "(" + params + ")"

	returns, retCount := formatFuncParams(fn.Type.Results)
	switch retCount {
	case 0:
		break
	case 1:
		ci.Detail += " " + returns
	default:
		ci.Detail += " (" + returns + ")"
	}

	return ci
}
