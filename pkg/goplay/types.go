package goplay

import (
	"errors"
	"time"
)

// FmtResponse is the response returned from
// upstream play.golang.org/fmt request
type FmtResponse struct {
	Body  string
	Error string
}

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

func (r CompileResponse) GetBody() string {
	if r.Body == nil {
		return ""
	}

	return *r.Body
}

func (cr *CompileResponse) HasError() error {
	if cr.Errors == "" {
		return nil
	}

	return errors.New(cr.Errors)
}
