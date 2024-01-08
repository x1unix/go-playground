package gowasm

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm.wasmConsoleWrite
func wasmConsoleWrite(fd int, data []byte)
