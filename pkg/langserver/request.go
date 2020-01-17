package langserver

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/x1unix/go-playground/pkg/goplay"

	"go.uber.org/zap"

	"github.com/x1unix/go-playground/pkg/analyzer"
)

type SuggestionRequest struct {
	PackageName string `json:"packageName"`
	Value       string `json:"value"`
}

func (sr SuggestionRequest) Trim() SuggestionRequest {
	return SuggestionRequest{
		PackageName: strings.TrimSpace(sr.PackageName),
		Value:       strings.TrimSpace(sr.Value),
	}
}

type ErrorResponse struct {
	code  int    `json:"-"`
	Error string `json:"error"`
}

func NewErrorResponse(err error) ErrorResponse {
	return ErrorResponse{Error: err.Error(), code: http.StatusInternalServerError}
}

// Errorf creates error response
func Errorf(code int, format string, args ...interface{}) ErrorResponse {
	return ErrorResponse{
		code:  code,
		Error: fmt.Sprintf(format, args...),
	}
}

func (r ErrorResponse) Write(w http.ResponseWriter) http.ResponseWriter {
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(r.code)
	if err := json.NewEncoder(w).Encode(r); err != nil {
		zap.S().Error(err)
	}
	return w
}

type SuggestionsResponse struct {
	Suggestions []*analyzer.CompletionItem `json:"suggestions"`
}

func (r SuggestionsResponse) Write(w http.ResponseWriter) {
	WriteJSON(w, r)
}

type CompilerResponse struct {
	Formatted string                 `json:"formatted,omitempty"`
	Events    []*goplay.CompileEvent `json:"events,omitempty"`
}

func WriteJSON(w http.ResponseWriter, i interface{}) {
	data, err := json.Marshal(i)
	if err != nil {
		NewErrorResponse(err).Write(w)
		return
	}

	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
	return
}
