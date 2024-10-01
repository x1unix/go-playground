package docutil

import (
	"strings"

	"github.com/x1unix/go-playground/pkg/monaco"
)

// Symbol is a generic primitive that holds symbol summary.
//
// Type is a type similar to monaco's CompletionItem but contains additional type data.
type Symbol struct {
	Label           string                              `json:"label"`
	Documentation   string                              `json:"documentation,omitempty"`
	Detail          string                              `json:"detail,omitempty"`
	InsertText      string                              `json:"insertText"`
	Signature       string                              `json:"signature,omitempty"`
	Kind            monaco.CompletionItemKind           `json:"kind"`
	InsertTextRules monaco.CompletionItemInsertTextRule `json:"insertTextRules"`
}

// Compare compares two symbol for sorting.
func (sym Symbol) Compare(b Symbol) int {
	return strings.Compare(sym.Label, b.Label)
}
