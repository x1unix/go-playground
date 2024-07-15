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
	Label               UnionString[CompletionItemLabel]   `json:"label"`
	Documentation       UnionString[IMarkdownString]       `json:"documentation"`
	Detail              string                             `json:"detail,omitempty"`
	SortText            string                             `json:"sortText,omitempty"`
	FilterText          string                             `json:"filterText,omitempty"`
	InsertText          string                             `json:"insertText,omitempty"`
	InsertTextRules     CompletionItemInsertTextRule       `json:"insertTextRules,omitempty"`
	CommitCharacters    []string                           `json:"commitCharacters,omitempty"`
	AdditionalTextEdits []ISingleEditOperation             `json:"additionalTextEdits,omitempty"`
	Tags                []CompletionItemTag                `json:"tags,omitempty"`
	Preselect           bool                               `json:"preselect,omitempty"`
	Kind                CompletionItemKind                 `json:"kind"`
	Range               *UnionString[CompletionItemRanges] `json:"range,omitempty"`
	Command             *Command                           `json:"command,omitempty"`
}
