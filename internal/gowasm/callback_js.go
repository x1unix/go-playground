package gowasm

import (
	"fmt"
	"syscall"
	"syscall/js"
)

const initSeats = 1024

type (
	CallbackID = int
	Result     = int
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

		ch <- result
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
func AwaitCallback(cbID CallbackID) error {
	res, err := AwaitResult(cbID)
	if err != nil {
		return err
	}

	if res == 0 {
		return nil
	}

	return syscall.Errno(res)
}

// AwaitResult awaits for callback completion and returns raw result.
func AwaitResult(cbID CallbackID) (Result, error) {
	ch, ok := callbacks[cbID]
	if !ok {
		return 0, ErrCallbackInvalid
	}

	v, ok := <-ch
	if !ok {
		return 0, ErrCallbackUsed
	}

	return v, nil
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
