package index

import "github.com/x1unix/go-playground/pkg/monaco"

const GoIndexFileVersion = 1

type PackageInfo struct {
	// Name is package name.
	Name string `json:"name"`

	// ImportPath is full import path of a package.
	ImportPath string `json:"importPath"`

	// Documentation is documentation in Markdown format.
	Documentation string `json:"documentation"`
}

type SymbolInfo struct {
	// Name is symbol name.
	Name string `json:"name"`

	// Documentation is documentation in Markdown format.
	Documentation string `json:"documentation"`

	// Detail is symbol summary.
	Detail string `json:"detail"`

	// InsertText is text to be inserted by completion.
	InsertText string `json:"insertText"`

	// InsertTextRules controls InsertText snippet format.
	InsertTextRules monaco.CompletionItemInsertTextRule `json:"insertTextRules,omitempty"`

	// Kind is symbol type.
	Kind monaco.CompletionItemKind `json:"kind"`

	// Package contains information where symbol came from.
	Package SymbolSource `json:"package"`
}

func SymbolInfoFromCompletionItem(item monaco.CompletionItem, src SymbolSource) SymbolInfo {
	doc := item.Documentation.String
	if item.Documentation.Value != nil {
		doc = item.Documentation.Value.Value
	}

	label := item.Label.String
	if item.Label.Value != nil {
		label = item.Label.Value.Label
	}

	return SymbolInfo{
		Name:            label,
		Documentation:   doc,
		Detail:          item.Detail,
		InsertText:      item.InsertText,
		InsertTextRules: item.InsertTextRules,
		Kind:            item.Kind,
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
