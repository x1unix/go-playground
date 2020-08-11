package goplay

import (
	"errors"
	"time"
)

// Snippet represents shared snippet
type Snippet struct {
	FileName string
	Contents string
}

// FmtResponse is the response returned from
// upstream play.golang.org/fmt request
type FmtResponse struct {
	Body  string
	Error string
}

// HasError returns error if any occurred
func (r *FmtResponse) HasError() error {
	if r.Error == "" {
		return nil
	}

	return CompileFailedError{msg: r.Error}
}

// CompileEvent represents individual
// event record in CompileResponse
type CompileEvent struct {
	Message string
	Kind    string
	Delay   time.Duration
}

// CompileResponse is the response returned from
// upstream play.golang.org/compile request
type CompileResponse struct {
	Body   *string
	Events []*CompileEvent
	Errors string
}

// GetBody returns response body
func (r CompileResponse) GetBody() string {
	if r.Body == nil {
		return ""
	}

	return *r.Body
}

// HasError returns error if any occurred
func (cr *CompileResponse) HasError() error {
	if cr.Errors == "" {
		return nil
	}

	return errors.New(cr.Errors)
}
