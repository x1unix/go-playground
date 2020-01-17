package langserver

import (
	"encoding/json"
	"go.uber.org/zap"
	"net/http"
	"strings"

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
	data, err := json.Marshal(r)
	w.Header().Add("Content-Type", "application/json")

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(r)
		return w
	}

	if _, err = w.Write(data); err != nil {
		zap.S().Error(err)
	}
	return w
}

type SuggestionsResponse struct {
	Suggestions []*analyzer.CompletionItem `json:"suggestions"`
}

func (r SuggestionsResponse) Write(w http.ResponseWriter) http.ResponseWriter {
	data, err := json.Marshal(r)

	w.Header().Add("Content-Type", "application/json")

	if err != nil {
		NewErrorResponse(err).Write(w)
		return w
	} else {
		w.WriteHeader(http.StatusInternalServerError)
	}

	w.Write(data)
	return w
}
