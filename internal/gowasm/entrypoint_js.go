package gowasm

import "syscall/js"

// registerWorkerEntrypoint registers worker entrypoint in WASM host.
// Entrypoint will be used by WASM host to call methods of a worker.
//
//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm.registerWorkerEntrypoint
func registerWorkerEntrypoint(methods []string, handler js.Func)
