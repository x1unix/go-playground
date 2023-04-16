package pacman

import (
	"go/parser"
	"go/token"
	"strconv"
)

//go:generate go run ../../../tools/collect-builtin -out=builtin_gen.go

// ParseFileImports returns imported packages from Go source text
func ParseFileImports(filename, moduleUrl string, code []byte) ([]string, error) {
	fset := token.NewFileSet()
	p, err := parser.ParseFile(fset, filename, code, parser.ImportsOnly)
	if err != nil {
		return nil, err
	}

	if len(p.Imports) == 0 {
		return nil, nil
	}

	imports := make([]string, 0, len(p.Imports))
	for _, importDecl := range p.Imports {
		importPath, err := strconv.Unquote(importDecl.Path.Value)
		if err != nil {
			importPath = importDecl.Path.Value
		}

		if isStandardGoPackage(importPath) {
			continue
		}

		if isSelfModulePackage(moduleUrl, importPath) {
			continue
		}

		imports = append(imports, importPath)
	}

	return imports, nil
}
