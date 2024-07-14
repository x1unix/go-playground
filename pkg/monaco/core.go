package monaco

type UriComponents struct {
	Scheme    string `json:"scheme,omitempty"`
	Authority string `json:"authority,omitempty"`
	Path      string `json:"path,omitempty"`
	Query     string `json:"query,omitempty"`
	Fragment  string `json:"fragment,omitempty"`
}

type IMarkdownString struct {
	Value             string                   `json:"value"`
	IsTrusted         bool                     `json:"isTrusted,omitempty"`
	SupportThemeIcons bool                     `json:"supportThemeIcons,omitempty"`
	SupportHtml       bool                     `json:"supportHtml,omitempty"`
	BaseUri           *UriComponents           `json:"baseUri,omitempty"`
	Uris              map[string]UriComponents `json:"uris,omitempty"`
}

type IRange struct {
	StartLineNumber int `json:"startLineNumber,omitempty"`
	StartColumn     int `json:"startColumn,omitempty"`
	EndLineNumber   int `json:"endLineNumber,omitempty"`
	EndColumn       int `json:"endColumn,omitempty"`
}

type Command struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Tooltip   string `json:"tooltip,omitempty"`
	Arguments []any  `json:"arguments,omitempty"`
}

type ISingleEditOperation struct {
	// The range to replace. This can be empty to emulate a simple insert.
	Range IRange `json:"range"`

	// The text to replace with. This can be null to emulate a simple delete.
	Text string `json:"text,omitempty"`

	// This indicates that this operation has "insert" semantics.
	// i.e. forceMoveMarkers = true => if `range` is collapsed, all markers at the position will be moved.
	ForceMoveMarkers bool `json:"forceMoveMarkers,omitempty"`
}
