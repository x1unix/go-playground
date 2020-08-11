package langserver

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"

	"github.com/x1unix/go-playground/pkg/analyzer"
	"github.com/x1unix/go-playground/pkg/goplay"
	"go.uber.org/zap"
)

// SnippetResponse is snippet response
type SnippetResponse struct {
	// FileName is snippet file name
	FileName string `json:"fileName"`

	// Code is snippet source
	Code string `json:"code"`
}

// ShareResponse is snippet share response
type ShareResponse struct {
	// SnippetID is definitely not a snippet id (sarcasm)
	SnippetID string `json:"snippetID"`
}

// SuggestionRequest is code completion suggestion request
type SuggestionRequest struct {
	PackageName string `json:"packageName"`
	Value       string `json:"value"`
}

// Trim trims request payload
func (sr SuggestionRequest) Trim() SuggestionRequest {
	return SuggestionRequest{
		PackageName: strings.TrimSpace(sr.PackageName),
		Value:       strings.TrimSpace(sr.Value),
	}
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

// VersionResponse is version response
type VersionResponse struct {
	// Version is server version
	Version string `json:"version"`
}

// Write writes data to response
func (r VersionResponse) Write(w http.ResponseWriter) {
	WriteJSON(w, r)
}

// SuggestionsResponse is code completion response
type SuggestionsResponse struct {
	// Suggestions is list of suggestions for monaco
	Suggestions []*analyzer.CompletionItem `json:"suggestions"`
}

// Write writes data to response
func (r SuggestionsResponse) Write(w http.ResponseWriter) {
	WriteJSON(w, r)
}

// BuildResponse is code complile response
type BuildResponse struct {
	// Formatted contains goimport'ed code
	Formatted string `json:"formatted,omitempty"`

	// FileName is file name
	FileName string `json:"fileName,omitempty"`
}

// RunResponse is code run response
type RunResponse struct {
	// Formatted contains goimport'ed code
	Formatted string `json:"formatted,omitempty"`

	// Events is list of code execution outputs
	Events []*goplay.CompileEvent `json:"events,omitempty"`
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
	w.Write(data)
	return
}

// goImportsCode reads code from request and performs "goimports" on it
// if any error occurs, it sends error response to client and closes connection
//
// if "format" url query param is undefined or set to "false", just returns code as is
func goImportsCode(ctx context.Context, src []byte) ([]byte, bool, error) {
	resp, err := goplay.GoImports(ctx, src)
	if err != nil {
		if err == goplay.ErrSnippetTooLarge {
			return nil, false, NewHTTPError(http.StatusRequestEntityTooLarge, err)
		}

		return nil, false, err
	}

	if err = resp.HasError(); err != nil {
		return nil, false, err
	}

	changed := resp.Body != string(src)
	return []byte(resp.Body), changed, nil
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
	src, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return nil, Errorf(http.StatusBadGateway, "failed to read request: %s", err)
	}

	r.Body.Close()
	return src, nil
}
