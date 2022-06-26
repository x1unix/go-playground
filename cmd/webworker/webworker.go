//go:build js
// +build js

package main

import (
	"syscall/js"

	"github.com/x1unix/go-playground/pkg/analyzer/check"
	"github.com/x1unix/go-playground/pkg/worker"
)

func main() {
	exportFunc, err := worker.GetModuleExportCallback()
	if err != nil {
		panic(err)
	}

	w := worker.NewWorker()
	w.RegisterFunc("analyzeCode", analyzeCode)
	defer w.Release()

	w.Export(exportFunc)
	w.Wait()
}

func analyzeCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}

	return check.Check(code)
}
