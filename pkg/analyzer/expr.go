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
	default:
		log.Warnf("expToString: unknown expression - [%[1]T %[1]v]", exp)
		return "interface{}"
	}
}
