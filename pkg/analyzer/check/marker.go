// package check checks provided Go code and reports syntax errors
package check

import "go/scanner"

// MarkerSeverity is equivalent for MarkerSeverity type in monaco-editor
type MarkerSeverity = int

const (
	Hint    = MarkerSeverity(1)
	Info    = MarkerSeverity(2)
	Warning = MarkerSeverity(3)
	Error   = MarkerSeverity(8)
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

func errorsListToMarkers(errList scanner.ErrorList) []MarkerData {
	markers := make([]MarkerData, 0, len(errList))
	for _, err := range errList {
		markers = append(markers, MarkerData{
			Severity:        Error,
			Message:         err.Msg,
			StartLineNumber: err.Pos.Line,
			EndLineNumber:   err.Pos.Line,
			StartColumn:     err.Pos.Column - 1,
			EndColumn:       err.Pos.Column,
		})
	}

	return markers
}

// Result is result
type Result struct {
	// HasErrors is error status
	HasErrors bool `json:"hasErrors"`

	// Markers is list of marker data
	Markers []MarkerData `json:"markers"`
}
