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

type SnippetResponse struct {
	FileName string `json:"fileName"`
	Code     string `json:"code"`
}

type ShareResponse struct {
	SnippetID string `json:"snippetID"`
}

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

func NewErrorResponse(err error) *ErrorResponse {
	return &ErrorResponse{Error: err.Error(), code: http.StatusInternalServerError}
}

func (r *ErrorResponse) Write(w http.ResponseWriter) http.ResponseWriter {
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(r.code)
	if err := json.NewEncoder(w).Encode(r); err != nil {
		zap.S().Error(err)
	}
	return w
}

type VersionResponse struct {
	Version string `json:"version"`
}

func (r VersionResponse) Write(w http.ResponseWriter) {
	WriteJSON(w, r)
}

type SuggestionsResponse struct {
	Suggestions []*analyzer.CompletionItem `json:"suggestions"`
}

func (r SuggestionsResponse) Write(w http.ResponseWriter) {
	WriteJSON(w, r)
}

type BuildResponse struct {
	Formatted string `json:"formatted,omitempty"`
	FileName  string `json:"fileName,omitempty"`
}

type RunResponse struct {
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
