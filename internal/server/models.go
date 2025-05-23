package server

import (
	"net/http"
	"strings"

	"github.com/x1unix/go-playground/internal/announcements"
	"github.com/x1unix/go-playground/pkg/goplay"
	"github.com/x1unix/go-playground/pkg/monaco"
)

const (
	// rawContentLengthHeader is a custom content length header
	// that contains content raw size before compression.
	//
	// The header is used to properly report download progress when
	// payload is transferred with compression.
	//
	// See: /web/src/utils/http.ts
	rawContentLengthHeader = "X-Raw-Content-Length"

	deprecationMsg = `"This endpoint is deprecated and will be removed in the next release!"`
)

type deprecatedMessage struct{}

func (deprecatedMessage) MarshalJSON() ([]byte, error) {
	return []byte(deprecationMsg), nil
}

// DeprecatedHeader is embeddable struct to mark in response that method is deprecated.
type DeprecatedHeader struct {
	DeprecationWarning deprecatedMessage `json:"deprecated"`
}

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

// VersionResponse is version response
type VersionResponse struct {
	// Version is server version
	Version string `json:"version"`

	// APIVersion is server API version
	APIVersion string `json:"apiVersion"`
}

// Write writes data to response
func (r VersionResponse) Write(w http.ResponseWriter) {
	WriteJSON(w, r)
}

// SuggestionsResponse is code completion response
type SuggestionsResponse struct {
	DeprecatedHeader

	// Suggestions are list of suggestions for monaco
	Suggestions []monaco.CompletionItem `json:"suggestions"`
}

// Write writes data to response
func (r SuggestionsResponse) Write(w http.ResponseWriter) {
	WriteJSON(w, r)
}

// BuildResponseV1 is build response for legacy API.
type BuildResponseV1 struct {
	DeprecatedHeader

	// Formatted contains goimport'ed code.
	Formatted string `json:"formatted,omitempty"`

	// FileName is file name
	FileName string `json:"fileName,omitempty"`
}

// BuildResponseV2 is WASM build response for v2 api.
type BuildResponseV2 struct {
	// FileName is file name
	FileName string `json:"fileName,omitempty"`

	// IsUnitTest indicates whether payload is a Go test.
	IsTest bool `json:"isTest,omitempty"`

	// HasBenchmark indicates whether program contains a benchmark.
	HasBenchmark bool `json:"hasBenchmark,omitempty"`

	// HasFuzz indicates whether program contains a fuzz test inside.
	HasFuzz bool `json:"hasFuzz,omitempty"`
}

// RunResponse is code run response
type RunResponse struct {
	// Formatted contains goimport'ed code.
	//
	// Deprecated and will be removed after api/v1 sunset.
	Formatted string `json:"formatted,omitempty"`

	// Events is list of code execution outputs
	Events []*goplay.CompileEvent `json:"events,omitempty"`
}

// PlaygroundVersions contains information about playground Go versions.
type PlaygroundVersions struct {
	// GoCurrent is a current Go version on Go playground.
	GoCurrent string `json:"current"`

	// GoPrevious is a previous Go version on Go playground.
	GoPrevious string `json:"goprev"`

	// GoTip is a dev branch Go version on Go playground.
	GoTip string `json:"gotip"`
}

func (vers *PlaygroundVersions) SetBackendVersion(backend goplay.Backend, version string) {
	var dst *string
	switch backend {
	case goplay.BackendGoCurrent:
		dst = &vers.GoCurrent
	case goplay.BackendGoPrev:
		dst = &vers.GoPrevious
	case goplay.BackendGoTip:
		dst = &vers.GoTip
	default:
		return
	}

	*dst = version
}

// VersionsInformation contains Go version for different run targets.
type VersionsInformation struct {
	// Playground contains information about Go versions on Go Playground server.
	Playground *PlaygroundVersions `json:"playground"`

	// WebAssembly is host Go version used for building WebAssembly Go files.
	WebAssembly string `json:"wasm"`
}

type GetAnnouncementResponse struct {
	Message *announcements.Announcement `json:"message"`
}
