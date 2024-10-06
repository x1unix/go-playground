// Package check checks provided Go code and reports syntax errors
package check

import (
	"go/scanner"

	"github.com/x1unix/go-playground/pkg/monaco"
)

func errorsListToMarkers(errList scanner.ErrorList) []monaco.MarkerData {
	markers := make([]monaco.MarkerData, 0, len(errList))
	for _, err := range errList {
		markers = append(markers, monaco.MarkerData{
			Severity:        monaco.Error,
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
	Markers []monaco.MarkerData `json:"markers"`
}
