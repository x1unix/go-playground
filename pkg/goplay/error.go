package goplay

import (
	"errors"
	"fmt"
	"net/http"
)

type HTTPError struct {
	StatusCode int
	Status     string
}

func NewHTTPError(rsp *http.Response) *HTTPError {
	return &HTTPError{
		Status:     rsp.Status,
		StatusCode: rsp.StatusCode,
	}
}

func (err HTTPError) Error() string {
	return fmt.Sprintf("bad response from playground server: %s", err.Status)
}

// IsHTTPError checks if passed error is HTTPError.
func IsHTTPError(err error) (*HTTPError, bool) {
	if err == nil {
		return nil, false
	}

	if e, ok := err.(*HTTPError); ok {
		return e, true
	}

	var httpErr *HTTPError
	if errors.As(err, httpErr) {
		return httpErr, true
	}

	return nil, false
}
