package langserver

import (
	"encoding/json"
	"go.uber.org/zap"
	"io"
	"net/http"
	"strconv"
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

func shouldFormatCode(r *http.Request) (bool, error) {
	val := r.URL.Query().Get(formatQueryParam)
	if val == "" {
		return false, nil
	}

	boolVal, err := strconv.ParseBool(val)
	if err != nil {
		return false, Errorf(
			http.StatusBadRequest,
			"invalid %q query parameter value (expected boolean)", formatQueryParam,
		)
	}

	return boolVal, nil
}

func getPayloadFromRequest(r *http.Request) ([]byte, error) {
	src, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, Errorf(http.StatusBadGateway, "failed to read request: %s", err)
	}

	r.Body.Close()
	return src, nil
}
