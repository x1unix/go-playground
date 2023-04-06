package gowasm

import (
	"syscall/js"
)

// registerCallbackHandler registers a global callback
// to receive capture async operations from JavaScript side.
func registerCallbackHandler(fn js.Func)

var callbackHandler = js.FuncOf(func(_ js.Value, args []js.Value) any {
	switch len(args) {
	case 0:
		panic("gowasm: missing callback ID")
	case 1:
		panic("gowasm: missing result value")
	}

	cbId := args[0].Int()
	result := args[0].Int()

	NotifyResult(cbId, result)
	return nil
})

func init() {
	registerCallbackHandler(callbackHandler)
}
