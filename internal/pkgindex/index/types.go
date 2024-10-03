package index

import (
	"github.com/x1unix/go-playground/internal/pkgindex/docutil"
	"github.com/x1unix/go-playground/pkg/monaco"
)

const GoIndexFileVersion = 1

type FlatSymbolSource [2]string

type PackageInfo struct {
	// Name is package name.
	Name string `json:"name"`

	// ImportPath is full import path of a package.
	ImportPath string `json:"importPath"`

	// Doc is documentation in Markdown format.
	Doc string `json:"doc,omitempty"`
}

// Packages is a flat representation of PackageInfo list.
type Packages struct {
	Names []string `json:"names"`
	Paths []string `json:"paths"`
	Docs  []string `json:"docs"`
}

func NewPackages(capacity int) Packages {
	return Packages{
		Names: make([]string, 0, capacity),
		Paths: make([]string, 0, capacity),
		Docs:  make([]string, 0, capacity),
	}
}

func (pkgs *Packages) Append(pkg PackageInfo) {
	pkgs.Names = append(pkgs.Names, pkg.Name)
	pkgs.Paths = append(pkgs.Paths, pkg.ImportPath)
	pkgs.Docs = append(pkgs.Docs, pkg.Doc)
}

// Symbols is a flat representation of Go package symbols.
type Symbols struct {
	// Names are list of symbol names.
	Names []string `json:"names"`

	// Docs are list of symbol documentation.
	Docs []string `json:"docs,omitempty"`

	// Details are list of short symbol summaries
	Details []string `json:"details,omitempty"`

	// Signatures contain string representation of a symbol (e.g. struct definition)
	// which is visible when user hovers on a symbol.
	Signatures []string `json:"signatures,omitempty"`

	// InsertTexts are values to be inserted when symbol suggestion is selected.
	InsertTexts []string `json:"insertTexts"`

	// InsertTextRules contains snippet insertion rules for InsertTexts.
	InsertTextRules []monaco.CompletionItemInsertTextRule `json:"insertTextRules,omitempty"`

	// Kinds contains symbol type for suggestion icon.
	Kinds []monaco.CompletionItemKind `json:"kinds"`

	// Packages contains information where particular symbol belongs (to what package).
	Packages []FlatSymbolSource `json:"packages"`
}

func NewSymbols(capacity int) Symbols {
	return Symbols{
		Names:           make([]string, 0, capacity),
		Docs:            make([]string, 0, capacity),
		Details:         make([]string, 0, capacity),
		Signatures:      make([]string, 0, capacity),
		InsertTexts:     make([]string, 0, capacity),
		InsertTextRules: make([]monaco.CompletionItemInsertTextRule, 0, capacity),
		Kinds:           make([]monaco.CompletionItemKind, 0, capacity),
		Packages:        make([]FlatSymbolSource, 0, capacity),
	}
}

func (s *Symbols) Append(src SymbolSource, sym docutil.Symbol) {
	s.Names = append(s.Names, sym.Label)
	s.Docs = append(s.Docs, sym.Documentation)
	s.Details = append(s.Details, sym.Detail)
	s.Signatures = append(s.Signatures, sym.Signature)
	s.InsertTexts = append(s.InsertTexts, sym.InsertText)
	s.InsertTextRules = append(s.InsertTextRules, sym.InsertTextRules)
	s.Kinds = append(s.Kinds, sym.Kind)
	s.Packages = append(s.Packages, src.Flatten())
}

// SymbolSource holds information where symbol belongs to.
type SymbolSource struct {
	// Name is package name.
	Name string `json:"name"`

	// Path is import path of a package.
	Path string `json:"path"`
}

func (s SymbolSource) Flatten() FlatSymbolSource {
	return FlatSymbolSource{s.Name, s.Path}
}

// GoIndexFile contains flat list of all Go packages and symbols (functions, types and values).
//
// Data is organized into a flat structure (soa) in order to reduce output file size.
type GoIndexFile struct {
	// Version is file format version.
	Version int `json:"version"`

	// Go is Go version used to generate index.
	Go string `json:"go"`

	// Packages is structure of arrays of standard Go packages.
	Packages Packages `json:"packages"`

	// Symbols is structure of arrays of package symbols.
	Symbols Symbols `json:"symbols"`
}
