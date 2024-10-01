package index

import (
	"github.com/x1unix/go-playground/internal/pkgindex/docutil"
	"github.com/x1unix/go-playground/pkg/monaco"
)

const GoIndexFileVersion = 1

type PackageInfo struct {
	// Name is package name.
	Name string `json:"name"`

	// ImportPath is full import path of a package.
	ImportPath string `json:"importPath"`

	// Doc is documentation in Markdown format.
	Doc string `json:"doc,omitempty"`
}

type SymbolInfo struct {
	// Name is symbol name.
	Name string `json:"name"`

	// Doc is documentation in Markdown format.
	Doc string `json:"doc,omitempty"`

	// Detail is symbol summary.
	Detail string `json:"detail,omitempty"`

	// Signature contains type declaration including public fields.
	Signature string `json:"signature,omitempty"`

	// InsertText is text to be inserted by completion.
	InsertText string `json:"insertText"`

	// InsertTextRules controls InsertText snippet format.
	InsertTextRules monaco.CompletionItemInsertTextRule `json:"insertTextRules,omitempty"`

	// Kind is symbol type.
	Kind monaco.CompletionItemKind `json:"kind"`

	// Package contains information where symbol came from.
	Package SymbolSource `json:"package"`
}

func IntoSymbolInfo(item docutil.Symbol, src SymbolSource) SymbolInfo {
	return SymbolInfo{
		Name:            item.Label,
		Doc:             item.Documentation,
		Detail:          item.Detail,
		InsertText:      item.InsertText,
		InsertTextRules: item.InsertTextRules,
		Kind:            item.Kind,
		Signature:       item.Signature,
		Package:         src,
	}
}

type SymbolSource struct {
	// Name is package name.
	Name string `json:"name"`

	// Path is import path of a package.
	Path string `json:"path"`
}

type GoIndexFile struct {
	// Version is file format version.
	Version int `json:"version"`

	// Go is Go version used to generate index.
	Go string `json:"go"`

	// Packages is list of standard Go packages.
	Packages []PackageInfo `json:"packages"`

	// Symbols is list of all Go symbols.
	Symbols []SymbolInfo `json:"symbols"`
}
