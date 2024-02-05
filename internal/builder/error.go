package builder

import (
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
