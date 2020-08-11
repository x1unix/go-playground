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
}

// MarkdownString is monaco-editor string with markdown
type MarkdownString struct {
	// Value is string contents
	Value string `json:"value"`
}
