package compiler

// BuildError is build error
type BuildError struct {
	message string
}

// Error implements error
func (e *BuildError) Error() string {
	return e.message
}

func newBuildError(msg string) *BuildError {
	return &BuildError{message: msg}
}
