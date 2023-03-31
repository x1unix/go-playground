package gowasm

import (
	"fmt"
	"syscall/js"
)

const initSeats = 1024

type (
	CallbackID = int
	Result     = int32
)

// registerCallbackHandler registers a global callback
// to receive capture async operations from JavaScript side.
func registerCallbackHandler(fn js.Func)

var (
	callbacks  = make(map[CallbackID]chan Result, initSeats)
	lastSeatID = 0

	callbackHandler = js.FuncOf(func(_ js.Value, args []js.Value) any {
		switch len(args) {
		case 0:
			panic("gowasm: missing callback ID")
		case 1:
			panic("gowasm: missing result value")
		}

		cbId := args[0].Int()
		result := args[0].Int()

		ch, ok := callbacks[cbId]
		if !ok {
			panic(fmt.Sprint("gowasm: invalid callback ID: ", cbId))
		}

		ch <- int32(result)
		return nil
	})
)

func init() {
	registerCallbackHandler(callbackHandler)
}

// RequestCallback requests a new callback to await for async operation.
func RequestCallback() CallbackID {
	lastSeatID++
	seatID := lastSeatID
	ch := make(chan Result, 1)
	callbacks[seatID] = ch
	return seatID
}

// AwaitCallback await for async operation to complete using callback ID.
func AwaitCallback(cbId CallbackID) Result {
	ch, ok := callbacks[cbId]
	if !ok {
		panic("invalid callback ID")
	}

	v, ok := <-ch
	if !ok {
		panic("callback channel is already closed")
	}

	return v
}

// ReleaseCallback releases acquired callback.
func ReleaseCallback(cbId int) {
	ch, ok := callbacks[cbId]
	if !ok {
		panic("invalid callback ID")
	}

	close(ch)
	delete(callbacks, cbId)
}
