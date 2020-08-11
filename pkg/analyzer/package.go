package analyzer

import (
	"path"
	"sync"

	"go.uber.org/zap"
)

var log *zap.SugaredLogger

const (
	ignoreMethods = true
	pkgBuiltin    = "builtin"
)

// Packages is list of packages
type Packages []*Package

// GetCompletionItems returns all symbols from packages
func (pkgs Packages) GetCompletionItems() []*CompletionItem {
	items := make([]*CompletionItem, 0, len(pkgs))
	for _, pkg := range pkgs {
		items = append(items, pkg.GetCompletionItem())
	}

	return items
}

// Package is Go package metadata
type Package struct {
	// Name is package name
	Name string `json:"name"`
	// Synopsis is package description
	Synopsis string `json:"synopsis"`
	// URL is godoc URL
	URL string `json:"url"`
	// Path is package import path
	Path string `json:"path"`
	// Children is list of sub-packages
	Children []*Package `json:"children"`
	PackageSummary

	scanOnce sync.Once
}

// IsBuiltin check if this is "builtin" special package
func (p *Package) IsBuiltin() bool {
	return p.Name == pkgBuiltin
}

// GetLocation returns absolute package location on disk
func (p *Package) GetLocation() string {
	return path.Join(goRoot, "src", p.Path)
}

// SymbolByChar returns list of symbols by first char
func (p *Package) SymbolByChar(chr string) []*CompletionItem {
	result := p.Values.Match(chr)
	return append(p.Functions.Match(chr), result...)
}

// AllSymbols returns all symbols
func (p *Package) AllSymbols() []*CompletionItem {
	out := make([]*CompletionItem, 0, p.Values.Len()+p.Functions.Len())
	out = append(out, p.Functions.Symbols...)
	out = append(out, p.Values.Symbols...)
	return out
}

// GetCompletionItem returns package symbol
func (p *Package) GetCompletionItem() *CompletionItem {
	return &CompletionItem{
		Label:         p.Name,
		Kind:          Module,
		Detail:        p.Name,
		Documentation: p.documentation(),
		InsertText:    p.Name,
	}
}

func (p *Package) documentation() MarkdownString {
	return MarkdownString{
		Value: p.Synopsis,
	}
}

// HasChildren returns if package has sub-packages
func (p *Package) HasChildren() bool {
	return len(p.Children) > 0
}

// Analyze performs package analysis from sources on disk
//
// This is one time operation
func (p *Package) Analyze() (err error) {
	p.scanOnce.Do(func() {
		scanner := NewPackageScanner(p.Name, p.GetLocation(), p.IsBuiltin())
		p.PackageSummary, err = scanner.Scan()
	})

	if err != nil {
		p.scanOnce = sync.Once{}
	}
	return err
}
