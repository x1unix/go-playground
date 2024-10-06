package monaco

// MarkerSeverity is equivalent for MarkerSeverity type in monaco-editor
type MarkerSeverity int

const (
	// Hint is marker severity from monaco-editor
	Hint = MarkerSeverity(1)
	// Info is marker severity from monaco-editor
	Info = MarkerSeverity(2)
	// Warning is marker severity from monaco-editor
	Warning = MarkerSeverity(3)
	// Error is marker severity from monaco-editor
	Error = MarkerSeverity(8)
)

// MarkerData is a structure defining a problem/warning/etc.
// Equivalent to IMarkerData in 'monaco-editor'
type MarkerData struct {
	// Severity is marker severity
	Severity MarkerSeverity `json:"severity"`
	// StartLineNumber is start line number
	StartLineNumber int `json:"startLineNumber"`
	// StartColumn is start column
	StartColumn int `json:"startColumn"`
	// EndLineNumber is end line number
	EndLineNumber int `json:"endLineNumber"`
	// EndColumn is end column
	EndColumn int `json:"endColumn"`
	// Message is marker message
	Message string `json:"message"`
}
