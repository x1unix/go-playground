package analyzer

// This file contains monaco-editor symbols bindings with the same symbol names.
// See: https://microsoft.github.io/monaco-editor/api/enums/monaco.languages.completionitemkind.html

// CompletionItemKind is monaco-editor binding
type CompletionItemKind int

const (
	Method CompletionItemKind = iota
	Function
	Constructor
	Field
	Variable
	Class
	Struct
	Interface
	Module
	Property
	Event
	Operator
	Unit
	Value
	Constant
	Enum
	EnumMember
	Keyword
	Text
	Color
	File
	Reference
	Customcolor
	Folder
	TypeParameter
	Snippet
)

// CompletionItemInsertTextRule is insert text insert rule.
type CompletionItemInsertTextRule int

const (
	// KeepWhitespace is adjust whitespace/indentation of
	// multiline insert texts to match the current line indentation.
	KeepWhitespace CompletionItemInsertTextRule = 1

	// InsertAsSnippet means that `insertText` is a snippet.
	InsertAsSnippet CompletionItemInsertTextRule = 4
)

// CompletionItem is monaco-editor binding
type CompletionItem struct {
	// Label is item label
	Label string `json:"label"`
	// Kind is item kind
	Kind CompletionItemKind `json:"kind"`
	// Detail is item description
	Detail string `json:"detail"`
	// Documentation is string or MarkdownString doc string
	Documentation interface{} `json:"documentation"`
	// InsertText is text to be inserted
	InsertText string `json:"insertText"`
	// InsertTextRules is a string or snippet that should be inserted in a document
	// when selecting this completion. When `falsy` the label in used.
	InsertTextRules CompletionItemInsertTextRule `json:"insertTextRules,omitempty"`
}

// MarkdownString is monaco-editor string with markdown
type MarkdownString struct {
	// Value is string contents
	Value string `json:"value"`
}

// NewMarkdownString returns markdown string
func NewMarkdownString(val string) MarkdownString {
	return MarkdownString{Value: val}
}
