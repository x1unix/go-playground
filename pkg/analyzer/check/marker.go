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
	Severity        MarkerSeverity `json:"severity"`
	StartLineNumber int            `json:"startLineNumber"`
	StartColumn     int            `json:"startColumn"`
	EndLineNumber   int            `json:"endLineNumber"`
	EndColumn       int            `json:"endColumn"`
	Message         string         `json:"message"`
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

type Result struct {
	HasErrors bool         `json:"hasErrors"`
	Markers   []MarkerData `json:"markers"`
}
