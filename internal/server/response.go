package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"go.uber.org/zap"
)

const maxFilesCount = 10

type FilesPayload struct {
	Files map[string]string `json:"files"`
}

// Validate checks file name and contents and returns error on validation failure.
func (p FilesPayload) Validate() error {
	if len(p.Files) == 0 {
		return errors.New("empty file list")
	}

	if len(p.Files) > maxFilesCount {
		return fmt.Errorf("too many files (max: %d)", maxFilesCount)
	}

	for name, src := range p.Files {
		switch filepath.Ext(name) {
		case ".go", ".mod":
			if len(strings.TrimSpace(src)) == 0 {
				return fmt.Errorf("empty file %q", name)
			}
		default:
			return fmt.Errorf("invalid file type: %q", name)
		}
	}

	return nil
}

// HasUnitTests checks whether file list contains any unit test.
//
// Note: at the moment, func doesn't check file contents and only check file names.
func (p FilesPayload) HasUnitTests() bool {
	for name := range p.Files {
		if strings.HasSuffix(name, "_test.go") {
			return true
		}
	}

	return false
}

// ErrorResponse is error response
type ErrorResponse struct {
	code int

	// Error is error message
	Error string `json:"error"`
}

// NewErrorResponse is ErrorResponse constructor
func NewErrorResponse(err error) *ErrorResponse {
	return &ErrorResponse{Error: err.Error(), code: http.StatusInternalServerError}
}

// Write writes error to response
func (r *ErrorResponse) Write(w http.ResponseWriter) http.ResponseWriter {
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(r.code)
	if err := json.NewEncoder(w).Encode(r); err != nil {
		zap.S().Error(err)
	}
	return w
}

// WriteJSON encodes object as JSON and writes it to stdout
func WriteJSON(w http.ResponseWriter, i interface{}) {
	data, err := json.Marshal(i)
	if err != nil {
		NewErrorResponse(err).Write(w)
		return
	}

	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}
