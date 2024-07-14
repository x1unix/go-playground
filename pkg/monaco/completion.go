package monaco

type CompletionItemLabel struct {
	Label       string `json:"label"`
	Detail      string `json:"detail,omitempty"`
	Description string `json:"description,omitempty"`
}

type CompletionItemRanges struct {
	Insert  IRange `json:"insert,omitempty"`
	Replace IRange `json:"replace,omitempty"`
}

type CompletionItem struct {
	// The label of this completion item. By default
	// this is also the text that is inserted when selecting
	// this completion.
	Label UnionString[CompletionItemLabel] `json:"label"`

	// The kind of this completion item. Based on the kind
	// an icon is chosen by the editor.
	Kind CompletionItemKind `json:"kind"`

	// A modifier to the `kind` which affect how the item
	// is rendered, e.g. Deprecated is rendered with a strikeout
	Tags []CompletionItemTag `json:"tags,omitempty"`

	// A human-readable string with additional information
	// about this item, like type or symbol information.
	Detail string `json:"detail,omitempty"`

	// A human-readable string that represents a doc-comment.
	Documentation *UnionString[IMarkdownString] `json:"documentation,omitempty"`

	// A string that should be used when comparing this item
	// with other items. When `falsy` the {@link CompletionItem.label label}
	// is used.
	SortText string `json:"sortText,omitempty"`

	// A string that should be used when filtering a set of
	// completion items. When `falsy` the {@link CompletionItem.label label}
	// is used.
	FilterText string `json:"filterText,omitempty"`

	// Select this item when showing. *Note* that only one completion item can be selected and
	// that the editor decides which item that is. The rule is that the *first* item of those
	// that match best is selected.
	Preselect bool `json:"preselect,omitempty"`

	// A string or snippet that should be inserted in a document when selecting
	// this completion.
	InsertText string `json:"insertText,omitempty"`

	// Additional rules (as bitmask) that should be applied when inserting
	// this completion.
	InsertTextRules CompletionItemInsertTextRule `json:"insertTextRules,omitempty"`

	// A range of text that should be replaced by this completion item.
	//
	// Defaults to a range from the start of the {@link TextDocument.getWordRangeAtPosition current word} to the
	// current position.
	//
	// *Note:* The range must be a {@link Range.isSingleLine single line} and it must
	// {@link Range.contains contain} the position at which completion has been {@link CompletionItemProvider.provideCompletionItems requested}.
	Range *UnionString[CompletionItemRanges] `json:"range,omitempty"`

	// An optional set of characters that when pressed while this completion is active will accept it first and
	// then type that character. *Note* that all commit characters should have `length=1` and that superfluous
	// characters will be ignored.
	CommitCharacters []string `json:"commitCharacters,omitempty"`

	// An optional array of additional text edits that are applied when
	// selecting this completion. Edits must not overlap with the main edit
	// nor with themselves.
	AdditionalTextEdits []ISingleEditOperation `json:"additionalTextEdits,omitempty"`

	// A command that should be run upon acceptance of this item.
	Command *Command `json:"command,omitempty"`
}
