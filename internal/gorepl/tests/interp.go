//go:build js

package tests

import (
	_ "embed"
	"fmt"
	"io/fs"
	"syscall/js"

	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"github.com/x1unix/go-playground/internal/gowasm/browserfs"
	"github.com/x1unix/go-playground/pkg/worker"
)

//go:embed testdata/sample.go
var sample []byte

type Handler struct {
	cache fs.FS
}

func NewHandler() *Handler {
	return &Handler{
		cache: browserfs.FS{},
	}
}

func (h *Handler) handleEvalCode(this js.Value, args worker.Args) (any, error) {
	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}

	return h.evalCode(code)
}

func (h *Handler) evalCode(code string) (any, error) {
	vm := interp.New(interp.Options{
		GoPath:               "/go",
		SourcecodeFilesystem: h.cache,
	})
	if err := vm.Use(stdlib.Symbols); err != nil {
		return nil, fmt.Errorf("interp.Use returned an error: %s", err)
	}

	res, err := vm.Eval(code)
	if res.Kind() == 0 || res.IsNil() {
		return nil, err
	}

	return res.Interface(), err
}

func RunInterp() {
	h := NewHandler()
	r, err := h.evalCode(string(sample))
	fmt.Println("Result: ", r)
	if err != nil {
		fmt.Println("Error: ", err)
	}
	//worker.ExportAndStart(worker.Exports{
	//	"evaluate": h.handleEvalCode,
	//})
}
