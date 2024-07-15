package monaco

type CompletionItemKind int

const (
	Method        CompletionItemKind = 0
	Function      CompletionItemKind = 1
	Constructor   CompletionItemKind = 2
	Field         CompletionItemKind = 3
	Variable      CompletionItemKind = 4
	Class         CompletionItemKind = 5
	Struct        CompletionItemKind = 6
	Interface     CompletionItemKind = 7
	Module        CompletionItemKind = 8
	Property      CompletionItemKind = 9
	Event         CompletionItemKind = 10
	Operator      CompletionItemKind = 11
	Unit          CompletionItemKind = 12
	Value         CompletionItemKind = 13
	Constant      CompletionItemKind = 14
	Enum          CompletionItemKind = 15
	EnumMember    CompletionItemKind = 16
	Keyword       CompletionItemKind = 17
	Text          CompletionItemKind = 18
	Color         CompletionItemKind = 19
	File          CompletionItemKind = 20
	Reference     CompletionItemKind = 21
	Customcolor   CompletionItemKind = 22
	Folder        CompletionItemKind = 23
	TypeParameter CompletionItemKind = 24
	User          CompletionItemKind = 25
	Issue         CompletionItemKind = 26
	Snippet       CompletionItemKind = 27
)

type CompletionItemTag int

const (
	Deprecated CompletionItemTag = 1
)

type CompletionItemInsertTextRule int

const (
	None            CompletionItemInsertTextRule = 0
	KeepWhitespace  CompletionItemInsertTextRule = 1
	InsertAsSnippet CompletionItemInsertTextRule = 4
)
