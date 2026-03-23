package docutil

import (
	"strings"

	"typefox.dev/lsp"
)

// Symbol is a generic primitive that holds symbol summary.
//
// Type is a type similar to LSP CompletionItem but contains additional type data.
type Symbol struct {
	Label           string                 `json:"label"`
	Documentation   string                 `json:"documentation,omitempty"`
	Detail          string                 `json:"detail,omitempty"`
	InsertText      string                 `json:"insertText"`
	Signature       string                 `json:"signature,omitempty"`
	Kind            lsp.CompletionItemKind `json:"kind"`
	InsertTextRules lsp.InsertTextFormat   `json:"insertTextRules"`
}

// Compare compares two symbol for sorting.
func (sym Symbol) Compare(b Symbol) int {
	return strings.Compare(sym.Label, b.Label)
}

// Collector accumulates symbols collected during AST traversal.
//
// Collector allows to reduce memory allocations caused by return slice allocations
// during recursive AST traversal.
type Collector interface {
	CollectSymbol(sym Symbol)
}

// CollectorFunc func type is an adapter to allow the use of ordinary functions as collectors.
//
// If f is a function with the appropriate signature, CollectorFunc(f) is a Collector that calls f.
type CollectorFunc func(sym Symbol)

func (fn CollectorFunc) CollectSymbol(sym Symbol) {
	fn(sym)
}
