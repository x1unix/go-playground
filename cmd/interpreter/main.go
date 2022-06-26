//go:build js
// +build js

package main

import (
	"github.com/traefik/yaegi/interp"
	"syscall/js"

	"github.com/x1unix/go-playground/pkg/worker"
)

func main() {
	exportFunc, err := worker.GetModuleExportCallback()
	if err != nil {
		panic(err)
	}

	w := worker.NewWorker()
	w.RegisterFunc("evalCode", evalCode)
	defer w.Release()

	w.Export(exportFunc)
	w.Wait()
}

func evalCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(code); err != nil {
		return nil, err
	}

	i := interp.New(interp.Options{})
	_, err := i.Eval(code)
	return nil, err
}
