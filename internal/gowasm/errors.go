package gowasm

import (
	"errors"
)

var (
	ErrCallbackInvalid = errors.New("invalid callback ID")
	ErrCallbackUsed    = errors.New("callback channel is already closed")
)
