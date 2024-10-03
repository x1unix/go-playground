// Package simple is a test package.
package simple

import "errors"

var (
	// ErrInvalidUnreadByte occurs when invalid use of UnreadByte is done.
	ErrInvalidUnreadByte = errors.New("bufio: invalid use of UnreadByte")
	Bar                  = 32
	Foo                  int32

	// Baz is a sample value.
	Baz bool = false

	// this var should be ignored
	private = true
)

func MyPublicFunc(foo int) (int, error) {
	return foo / 32, nil
}
