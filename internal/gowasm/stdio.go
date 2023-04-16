package gowasm

import (
	"fmt"
	"syscall"
)

var (
	Stdout = newConsoleWriter(syscall.Stdout)
	Stderr = newConsoleWriter(syscall.Stderr)
)

type consoleWriter struct {
	fdId int
}

func newConsoleWriter(fdId int) consoleWriter {
	return consoleWriter{fdId: fdId}
}

func (w consoleWriter) Write(data []byte) (n int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("logWrite: %s", r)
		}
	}()

	wasmConsoleWrite(w.fdId, data)
	return len(data), nil
}
