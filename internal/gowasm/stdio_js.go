package gowasm

//go:generate go run ../../tools/gowasm-gen-import $GOFILE

//gowasm:import
func wasmConsoleWrite(fd int, data []byte)
