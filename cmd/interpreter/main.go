//go:build js
// +build js

package main

import (
	"github.com/traefik/yaegi/interp"
	"syscall/js"

	"github.com/x1unix/go-playground/pkg/worker"
)

func main() {
	worker.ExportAndStart("evaluate", evalCode)
}

func evalCode(this js.Value, args worker.Args) (interface{}, error) {
	var code string
	if err := args.Bind(code); err != nil {
		return nil, err
	}

	i := interp.New(interp.Options{})
	res, err := i.Eval(code)
	return js.ValueOf(res), err
}
