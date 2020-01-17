package analyzer

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

type CompletionItem struct {
	Label         string             `json:"label"`
	Kind          CompletionItemKind `json:"kind"`
	Detail        string             `json:"detail"`
	Documentation string             `json:"documentation"`
	InsertText    string             `json:"insertText"`
}
