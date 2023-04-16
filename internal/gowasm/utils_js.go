package gowasm

import (
	"fmt"
	"syscall/js"
)

// CopyBytesToGo is a panic-safe version of js.CopyBytesToGo
func CopyBytesToGo(dst []byte, src js.Value) (n int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("gowasm.CopyBytesToGo: %s", err)
		}
	}()

	// TODO: replace with custom panic-less implementation
	n = js.CopyBytesToGo(dst, src)
	return n, nil
}
