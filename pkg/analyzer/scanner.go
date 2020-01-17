package analyzer

import (
	"go/ast"
	"go/parser"
	"go/token"
)

type PackageSummary struct {
	Functions SymbolIndex
	Values    SymbolIndex
}

func NewPackageSummary() PackageSummary {
	return PackageSummary{
		Functions: emptySymbolIndex(),
		Values:    emptySymbolIndex(),
	}
}

type PackageScanner struct {
	name, path  string
	scanPrivate bool
}

func NewPackageScanner(pkgName, pkgPath string, scanPrivate bool) PackageScanner {
	return PackageScanner{
		name:        pkgName,
		path:        pkgPath,
		scanPrivate: scanPrivate,
	}
}

func (p *PackageScanner) appendGen(g *ast.GenDecl, dest *PackageSummary) {
	switch g.Tok {
	case token.CONST, token.VAR:
		for _, s := range g.Specs {
			val := s.(*ast.ValueSpec)
			vals := valSpecToItem(g.Tok != token.VAR, val, p.scanPrivate)
			dest.Values.Append(vals...)
		}
	case token.TYPE:
		//log.Debugf("type - %#v", g.Specs)
		//for _, typ := range g.Specs {
		//	spec := typ.(*ast.TypeSpec)
		//	log.Debugf("- %#v", spec.Name.String())
		//}
	default:
	}
}

func (p *PackageScanner) appendFunc(fn *ast.FuncDecl, dest *SymbolIndex) {
	if !fn.Name.IsExported() {
		if !p.scanPrivate {
			return
		}
	}

	if ignoreMethods && (fn.Name.Obj == nil) {
		// Temporary ignore struct methods
		log.Debugf("ignore struct method '%s.%s'", p.name, fn.Name.String())
		return
	}

	item := funcToItem(fn)
	log.Debugf("found function '%s.%s' - %s'", p.name, item.InsertText, item.Detail)
	dest.Append(item)
}

func (p *PackageScanner) Scan() (PackageSummary, error) {
	sum := NewPackageSummary()
	set := token.NewFileSet()
	packs, err := parser.ParseDir(set, p.path, nil, 0)
	if err != nil {
		return sum, err
	}

	for _, pack := range packs {
		for _, f := range pack.Files {
			if ignoreFile(f) {
				continue
			}

			for _, decl := range f.Decls {
				switch t := decl.(type) {
				case *ast.FuncDecl:
					p.appendFunc(t, &sum.Functions)
				case *ast.GenDecl:
					p.appendGen(t, &sum)
				default:
					log.Warnf("unknown decl: %[1]T %[1]v", t)
				}
			}
		}
	}
	return sum, nil
}
