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

type Packages []*Package

func (pkgs Packages) GetCompletionItems() []*CompletionItem {
	items := make([]*CompletionItem, 0, len(pkgs))
	for _, pkg := range pkgs {
		items = append(items, pkg.GetCompletionItem())
	}

	return items
}

type Package struct {
	Name     string     `json:"name"`
	Synopsis string     `json:"synopsis"`
	URL      string     `json:"url"`
	Path     string     `json:"path"`
	Children []*Package `json:"children"`
	PackageSummary

	scanOnce sync.Once
}

// IsBuiltin check if this is "builtin" special package
func (p *Package) IsBuiltin() bool {
	return p.Name == pkgBuiltin
}

func (p *Package) GetLocation() string {
	return path.Join(goRoot, "src", p.Path)
}

func (p *Package) SymbolByChar(chr string) []*CompletionItem {
	result := p.Values.Match(chr)
	return append(p.Functions.Match(chr), result...)
}

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

func (p *Package) HasChildren() bool {
	return len(p.Children) > 0
}

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
