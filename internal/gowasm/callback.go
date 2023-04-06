package gowasm

import (
	"fmt"
	"sync"
	"syscall"
)

const initSeats = 1024

var (
	callbacks  = make(map[CallbackID]chan Result, initSeats)
	lastSeatID = 0
	lock       sync.Mutex
)

type (
	CallbackID = int
	Result     = int
)

// RequestCallback requests a new callback to await for async operation.
func RequestCallback() CallbackID {
	lock.Lock()
	defer lock.Unlock()

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

// NotifyResult publishes callback result and notifies listener.
//
// This method is intended to be called only from JS side and kept public only for testing purposes.
func NotifyResult(cb CallbackID, result Result) {
	ch, ok := callbacks[cb]
	if !ok {
		panic(fmt.Sprint("gowasm: invalid callback ID: ", cb))
	}

	ch <- result
}
