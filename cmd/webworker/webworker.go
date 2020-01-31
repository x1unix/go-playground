package main

import (
	"fmt"
	"os"
	"syscall/js"

	"github.com/x1unix/go-playground/pkg/analyzer/check"

	"github.com/x1unix/go-playground/pkg/worker"
)

type void = struct{}

var (
	done     = make(chan void, 0)
	onResult js.Value
)

func main() {
	entrypoint, err := getEntrypointFunction()
	if err != nil {
		panic(err)
	}

	// prepare exports object
	analyzeCodeCb := worker.FuncOf(analyzeCode)
	exitCb := js.FuncOf(exit)
	module := map[string]interface{}{
		"analyzeCode": analyzeCodeCb,
		"exit":        exitCb,
	}

	defer analyzeCodeCb.Release()
	defer exitCb.Release()

	entrypoint.Invoke(js.ValueOf(module))
	<-done
	fmt.Println("Go: exit")
}

func getEntrypointFunction() (js.Value, error) {
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

func exit(this js.Value, args []js.Value) interface{} {
	go func() {
		done <- void{}
	}()
	return nil
}

func analyzeCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}

	return check.Check(code)
}
