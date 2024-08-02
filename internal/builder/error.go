package builder

import (
	"bytes"
	"context"
	"errors"
	"fmt"
)

// BuildError is build error
type BuildError struct {
	message string
}

// Error implements error
func (e *BuildError) Error() string {
	return e.message
}

func newBuildError(msg string, args ...any) *BuildError {
	if len(args) > 0 {
		msg = fmt.Sprintf(msg, args...)
	}

	return &BuildError{message: msg}
}

func IsBuildError(err error) bool {
	if err == nil {
		return false
	}

	dst := new(BuildError)
	return errors.As(err, &dst)
}

func checkContextErrors(err error) (error, bool) {
	if err == nil {
		return nil, false
	}

	if errors.Is(err, context.Canceled) {
		return err, true
	}

	if errors.Is(err, context.DeadlineExceeded) {
		return newBuildError("Go program build timeout exceeded"), true
	}

	return nil, false
}

func formatBuildError(ctx context.Context, err error, buff *bytes.Buffer) error {
	if buff.Len() > 0 {
		return newBuildError(buff.String())
	}

	newErr, ok := checkContextErrors(err)
	if ok {
		return newErr
	}

	newErr, ok = checkContextErrors(ctx.Err())
	if ok {
		return newErr
	}

	return newBuildError("Build process returned an error: %s", err)
}
