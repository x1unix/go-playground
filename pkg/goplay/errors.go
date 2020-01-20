package goplay

import "errors"

var ErrSnippetNotFound = errors.New("snippet not found")

type CompileFailedError struct {
	msg string
}

func (c CompileFailedError) Error() string {
	return c.msg
}

func IsCompileError(err error) bool {
	_, ok := err.(CompileFailedError)
	return ok
}
