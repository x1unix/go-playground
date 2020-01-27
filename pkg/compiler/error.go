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

//func newBuildError(errPipe io.ReadCloser, baseErr error) *BuildError {
//	data, err := ioutil.ReadAll(errPipe)
//	if err != nil {
//		return &BuildError{message: baseErr.Error()}
//	}
//
//	return &BuildError{message: string(data)}
//}
