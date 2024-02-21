package goplay

import "errors"

// ErrSnippetNotFound is snippet not found error
var ErrSnippetNotFound = errors.New("snippet not found")

// CompileFailedError is build error
type CompileFailedError struct {
	msg string
}

// Error implements error
func (c CompileFailedError) Error() string {
	return c.msg
}

// IsCompileError checks if error is CompileFailedError
func IsCompileError(err error) bool {
	if err == nil {
		return false
	}
	_, ok := err.(CompileFailedError)
	return ok
}
