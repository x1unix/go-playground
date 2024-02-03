package langserver

import (
	"encoding/json"
	"net/http"

	"go.uber.org/zap"
)

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
