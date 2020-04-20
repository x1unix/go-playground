package compiler

type BuildError struct {
	message string
}

func (e *BuildError) Error() string {
	return e.message
}

func newBuildError(msg string) *BuildError {
	return &BuildError{message: msg}
}
