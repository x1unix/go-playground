// Package check checks provided Go code and reports syntax errors
package check

import (
	"go/scanner"

	"typefox.dev/lsp"
)

func errorsListToMarkers(errList scanner.ErrorList) []lsp.Diagnostic {
	markers := make([]lsp.Diagnostic, 0, len(errList))
	for _, err := range errList {
		// token.Position uses 1-based line/column indexes while LSP positions are 0-based.
		startLine := normalizeLSPPosition(err.Pos.Line - 1)
		startColumn := normalizeLSPPosition(err.Pos.Column - 1)
		endColumn := normalizeLSPPosition(err.Pos.Column)

		markers = append(markers, lsp.Diagnostic{
			Severity: lsp.SeverityError,
			Message:  err.Msg,
			Range: lsp.Range{
				Start: lsp.Position{Line: startLine, Character: startColumn},
				End:   lsp.Position{Line: startLine, Character: endColumn},
			},
		})
	}

	return markers
}

func normalizeLSPPosition(value int) uint32 {
	if value < 0 {
		return 0
	}

	return uint32(value)
}

// Result is result
type Result struct {
	// HasErrors is error status
	HasErrors bool `json:"hasErrors"`

	// Markers is list of diagnostics
	Markers []lsp.Diagnostic `json:"markers"`
}
