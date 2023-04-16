package gorepl

import "fmt"

type BuildError struct {
	msg string
	err error
}

func newBuildError(err error, msg string) BuildError {
	return BuildError{
		msg: msg,
		err: err,
	}
}

func (err BuildError) Error() string {
	if len(err.msg) == 0 {
		return err.err.Error()
	}

	return fmt.Sprint(err.msg, ": ", err.err)
}

func (err BuildError) Unwrap() error {
	return err.err
}
