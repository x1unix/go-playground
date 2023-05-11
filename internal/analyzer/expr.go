package analyzer

import (
	"go/ast"
	"strings"
)

func ignoreFile(f *ast.File) bool {
	return strings.Contains(f.Name.String(), "_test")
}

func expToString(exp ast.Expr) string {
	if exp == nil {
		return ""
	}
	switch v := exp.(type) {
	case *ast.Ident:
		return v.String()
	case *ast.ArrayType:
		t := expToString(v.Elt)
		return "[]" + t
	case *ast.SelectorExpr:
		return v.Sel.String()
	case *ast.StarExpr:
		return "*" + expToString(v.X)
	case *ast.Ellipsis:
		return "..." + expToString(v.Elt)
	case *ast.MapType:
		keyT := expToString(v.Key)
		valT := expToString(v.Value)
		return "map[" + keyT + "]" + valT
	case *ast.ChanType:
		chanT := expToString(v.Value)
		return "chan " + chanT
	case *ast.InterfaceType:
		typ := "interface{"
		fields, fieldCount := formatFieldsList(v.Methods, "\n")
		if fieldCount > 0 {
			typ += "\n" + fields + "\n"
		}
		return typ + "}"
	case *ast.FuncType:
		return funcToString(v)
	default:
		log.Warnf("expToString: unknown expression - [%[1]T %[1]v]", exp)
		return "interface{}"
	}
}
