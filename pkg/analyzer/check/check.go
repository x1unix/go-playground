package check

import (
	"go/parser"
	"go/scanner"
	"go/token"
)

// Check checks Go code and returns check result
func Check(src string) (*Result, error) {
	fset := token.NewFileSet()
	_, err := parser.ParseFile(fset, "main.go", src, parser.AllErrors)
	if err == nil {
		return &Result{HasErrors: false}, nil
	}

	if errList, ok := err.(scanner.ErrorList); ok {
		return &Result{HasErrors: true, Markers: errorsListToMarkers(errList)}, nil
	}

	return nil, err
}
