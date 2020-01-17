package langserver

import (
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
	Error error `json:"error"`
}

type SuggestionsResponse struct {
	Suggestions []*analyzer.CompletionItem `json:"suggestions"`
}
