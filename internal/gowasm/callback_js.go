package gowasm

import (
	"github.com/x1unix/go-playground/internal/gowasm/wlog"
	"syscall/js"
)

//go:generate go run ../../tools/gowasm-gen-import $GOFILE

// registerCallbackHandler registers a global callback
// to receive capture async operations from JavaScript side.
//
//gowasm:import
func registerCallbackHandler(fn js.Func)

var callbackHandler = js.FuncOf(func(_ js.Value, args []js.Value) any {
	switch len(args) {
	case 0:
		panic("gowasm: missing callback ID")
	case 1:
		panic("gowasm: missing result value")
	}

	cbId := args[0].Int()
	result := args[1].Int()

	wlog.Debugf("NotifyResult: CbID=%d Result=%d", cbId, result)
	NotifyResult(cbId, result)
	return nil
})

func init() {
	registerCallbackHandler(callbackHandler)
}
