package goplay

import (
	"errors"
	"net/url"
	"strconv"
	"time"
)

const DefaultVersion = 2

type Backend = string

const (
	BackendGoCurrent = ""
	BackendGoPrev    = "goprev"
	BackendGoTip     = "gotip"
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

type CompileRequest struct {
	Version int
	WithVet bool
	Body    []byte
}

func (r CompileRequest) URLValues() url.Values {
	if r.Version == 0 {
		r.Version = DefaultVersion
	}

	form := make(url.Values, 3)
	form.Add("version", strconv.Itoa(r.Version))
	form.Add("withVet", strconv.FormatBool(r.WithVet))
	form.Add("body", string(r.Body))
	return form
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
func (cr CompileResponse) GetBody() string {
	if cr.Body == nil {
		return ""
	}

	return *cr.Body
}

// HasError returns error if any occurred
func (cr *CompileResponse) HasError() error {
	if cr.Errors == "" {
		return nil
	}

	return errors.New(cr.Errors)
}
