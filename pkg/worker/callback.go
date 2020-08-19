// +build js

package worker

import "syscall/js"

// Callback is async function callback
type Callback = func(interface{}, error)

func newCallbackFromValue(val js.Value) (Callback, error) {
	if typ := val.Type(); typ != js.TypeFunction {
		return nil, NewTypeError(js.TypeFunction, typ)
	}

	return func(result interface{}, err error) {
		if err != nil {
			val.Invoke(js.ValueOf(NewErrorResponse(err).JSON()))
		}

		if result == nil {
			val.Invoke()
			return
		}

		val.Invoke(js.ValueOf(NewResponse(result, nil).JSON()))
	}, nil
}
