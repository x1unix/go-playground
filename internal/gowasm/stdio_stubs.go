//go:build !js

package gowasm

import (
	"os"
	"syscall"
)

func wasmConsoleWrite(fd int, data []byte) {
	if fd == syscall.Stderr {
		_, _ = os.Stderr.Write(data)
	}

	_, _ = os.Stdout.Write(data)
}
