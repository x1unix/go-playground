package check

import (
	"errors"
	"go/parser"
	"go/scanner"
	"go/token"
)

// Check checks Go code and returns check result
func Check(src string) (*Result, error) {
	fset := token.NewFileSet()
	_, err := parser.ParseFile(fset, "main.go", src, parser.DeclarationErrors)
	if err == nil {
		return &Result{HasErrors: false}, nil
	}

	var errList scanner.ErrorList
	if errors.As(err, &errList) {
		return &Result{HasErrors: true, Markers: errorsListToMarkers(errList)}, nil
	}

	return nil, err
}
