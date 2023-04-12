package gowasm

import "syscall/js"

//go:generate go run ../../tools/gowasm-gen-import $GOFILE

// registerWorkerEntrypoint registers worker entrypoint in WASM host.
// Entrypoint will be used by WASM host to call methods of a worker.
//
//gowasm:import
func registerWorkerEntrypoint(methods []string, handler js.Func)
