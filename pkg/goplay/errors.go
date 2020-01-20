package goplay

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
