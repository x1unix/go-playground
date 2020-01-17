package langserver

import (
	"encoding/json"
	"net/http"
	"strings"

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
	Error string `json:"error"`
}

func NewErrorResponse(err error) ErrorResponse {
	return ErrorResponse{Error: err.Error()}
}

func (r ErrorResponse) Write(w http.ResponseWriter) http.ResponseWriter {
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	if err := json.NewEncoder(w).Encode(r); err != nil {
		zap.S().Error(err)
	}
	return w
}

type SuggestionsResponse struct {
	ID          string                     `json:"id"`
	Suggestions []*analyzer.CompletionItem `json:"suggestions"`
}

func (r SuggestionsResponse) Write(w http.ResponseWriter) http.ResponseWriter {
	data, err := json.Marshal(r)

	w.Header().Add("Content-Type", "application/json")

	if err != nil {
		NewErrorResponse(err).Write(w)
		return w
	}

	w.WriteHeader(http.StatusOK)
	w.Write(data)
	return w
}
