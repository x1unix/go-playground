//go:build js
// +build js

// Package worker contains Go web-worker WASM module bridge methods
package worker

import (
	"fmt"
	"syscall/js"
)

// Func is worker handler function
type Func = func(this js.Value, args Args) (interface{}, error)

// ParseArgs parses async call arguments.
//
// Function expects the last argument to be a callable JS function
func ParseArgs(allArgs []js.Value) (Args, Callback, error) {
	argLen := len(allArgs)
	if argLen == 0 {
		return nil, nil, fmt.Errorf("function requires at least 1 argument, but only 0 were passed")
	}

	lastIndex := len(allArgs) - 1
	cb, err := newCallbackFromValue(allArgs[lastIndex:][0])
	if err != nil {
		return nil, nil, fmt.Errorf("last function argument should be callable (%s)", err)
	}

	return allArgs[:lastIndex], cb, nil
}

func callFunc(fn Func, this js.Value, jsArgs []js.Value) {
	args, callback, err := ParseArgs(jsArgs)
	if err != nil {
		js.Global().Get("console").Call("error", fmt.Sprintf("go worker: %s", err))
		panic(err)
	}

	callback(fn(this, args))
}

// FuncOf wraps function into js-compatible async function with callback
func FuncOf(fn Func) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		go callFunc(fn, this, args)
		return nil
	})
}
