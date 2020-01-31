package main

import (
	"fmt"
	"syscall/js"

	"github.com/x1unix/go-playground/pkg/analyzer/check"

	"github.com/x1unix/go-playground/internal/worker"
)

type void = struct{}

var (
	done     = make(chan void, 0)
	onResult js.Value
)

func main() {
	fmt.Println("Hello")

	msgHandleCb := worker.FuncOf(analyzeCode)
	exitCb := js.FuncOf(exit)
	module := map[string]interface{}{
		"handleMessage": msgHandleCb,
		"exit":          exitCb,
	}

	defer msgHandleCb.Release()
	defer exitCb.Release()

	js.Global().Get("onModuleInit").Invoke(js.ValueOf(module))
	<-done
	fmt.Println("Go: exit")
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
