package server

import (
	"fmt"
	"net/http"

	"github.com/x1unix/go-playground/pkg/goplay"
)

// ErrSnippetTooLarge is snippet max size limit error
var ErrSnippetTooLarge = Errorf(
	http.StatusRequestEntityTooLarge,
	"code snippet too large (max %d bytes)",
	goplay.MaxSnippetSize,
)

// HTTPError is HTTP response error
type HTTPError struct {
	code   int
	parent error
}

// Error implements error
func (err *HTTPError) Error() string {
	return fmt.Sprintf("%s: %s", http.StatusText(err.code), err.parent)
}

// Unwrap implements error
func (err *HTTPError) Unwrap() error {
	return err.parent
}

// WriteResponse writes error to response
func (err *HTTPError) WriteResponse(rw http.ResponseWriter) {
	resp := ErrorResponse{code: err.code, Error: err.parent.Error()}
	resp.Write(rw)
}

// NewHTTPError constructs a new error
func NewHTTPError(code int, err error) *HTTPError {
	return &HTTPError{code: code, parent: err}
}

// Errorf returns new formatted error
func Errorf(code int, format string, args ...interface{}) *HTTPError {
	return NewHTTPError(code, fmt.Errorf(format, args...))
}

func NewBadRequestError(err error) *HTTPError {
	return NewHTTPError(http.StatusBadRequest, err)
}
