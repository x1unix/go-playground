//go:build js
// +build js

package worker

import (
	"fmt"
	"os"
	"syscall/js"
)

type void = struct{}

// Releaser interface represents a value that should be released.
type Releaser interface {
	Release()
}

// Handlers is a key-value pair of function name and handler.
type Handlers = map[string]Func

// Worker is Go WebAssembly daemon that receives function calls
// from JS world and manages application lifecycle.
type Worker struct {
	done         chan void
	name         string
	exportObject map[string]any
	releaseList  []Releaser
}

// NewWorker constructs a new worker
func NewWorker() *Worker {
	return &Worker{
		done:         make(chan void, 0),
		releaseList:  make([]Releaser, 0, 2),
		exportObject: make(map[string]any, 2),
	}
}

// RegisterFunc registers a function handler that will be exported.
func (w *Worker) RegisterFunc(fnName string, handler Func) {
	fn := FuncOf(handler)
	w.exportObject[fnName] = fn
	w.RegisterReleaser(fn)
}

// RegisterReleaser registers a releasable resource that should be released
// on worker shutdown by Worker.Release call.
//
// Used to register resources like js.Func that should be cleaned on shutdown.
func (w *Worker) RegisterReleaser(releaser Releaser, other ...Releaser) {
	w.releaseList = append(w.releaseList, releaser)
	if len(other) > 0 {
		w.releaseList = append(w.releaseList, other...)
	}
}

// Export calls a passed JS function with passed export object
// which contains all registered functions as argument.
//
// Exported object contains all functions added by Worker.RegisterFunc.
func (w *Worker) Export(callback js.Value) {
	exitCb := js.FuncOf(w.onExit)
	w.exportObject["exit"] = exitCb
	w.RegisterReleaser(exitCb)
	callback.Invoke(js.ValueOf(w.exportObject))
}

// Wait blocks the calling thread and waits for incoming calls
// until an exported exit function is called from JavaScript.
func (w Worker) Wait() {
	<-w.done
}

// Release releases all worker resources.
//
// Should be called at worker shutdown.
func (w Worker) Release() {
	for _, handle := range w.releaseList {
		handle.Release()
	}
}

func (w Worker) onExit(this js.Value, args []js.Value) any {
	go func() {
		w.done <- void{}
	}()
	return nil
}

// GetModuleExportCallback obtains a callback function to pass worker export object
// from worker command line arguments.
//
// Obtained function should be used as argument for Worker.Export method.
//
// Passed function name should be global.
func GetModuleExportCallback() (js.Value, error) {
	if len(os.Args) < 2 {
		return js.Value{}, fmt.Errorf("WASM module requires at least 2 arguments: 'js' and entrypoint function name")
	}

	entrypointName := os.Args[1]
	entrypoint := js.Global().Get(entrypointName)
	switch t := entrypoint.Type(); t {
	case js.TypeFunction:
		return entrypoint, nil
	case js.TypeUndefined:
		return js.Value{}, fmt.Errorf("function %q doesn't exists on global JS scope", entrypointName)
	default:
		return js.Value{}, fmt.Errorf("%q should be callable JS function, but got %d instead", entrypointName, t)
	}
}

// Exports is module exports map with key-value pair of name and function.
type Exports map[string]Func

// ExportAndStart starts a simple worker and exports functions it to JavaScript.
//
// For more sophisticated cases, use worker.NewWorker to manually
// create and register a worker.
//
// Also see worker.GetModuleExportCallback for more information
// about worker registration.
func ExportAndStart(exports Exports) {
	exportFunc, err := GetModuleExportCallback()
	if err != nil {
		panic(err)
	}

	w := NewWorker()
	for name, fn := range exports {
		w.RegisterFunc(name, fn)
	}

	defer w.Release()
	w.Export(exportFunc)
	w.Wait()
}
