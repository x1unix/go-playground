package gowasm

import (
	"fmt"
	"sync"
	"syscall"

	"github.com/x1unix/go-playground/internal/gowasm/wlog"
	"github.com/x1unix/go-playground/internal/util/syncx"
)

var (
	callbacks = syncx.NewMap[CallbackID, chan Result]()

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
	callbacks.Put(seatID, ch)
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
	ch, ok := callbacks.Get(cbID)
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
func ReleaseCallback(cbId CallbackID) {
	lock.Lock()
	defer lock.Unlock()

	ch, ok := callbacks.Get(cbId)
	if !ok {
		panic("invalid callback ID")
	}

	close(ch)
	callbacks.Delete(cbId)
}

// NotifyResult publishes callback result and notifies listener.
//
// This method is intended to be called only from JS side and kept public only for testing purposes.
func NotifyResult(cb CallbackID, result Result) {
	ch, ok := callbacks.Get(cb)
	if !ok {
		panic(fmt.Sprintf("gowasm: invalid callback ID: %d. Known IDs: %d", cb, callbacks.Keys()))
	}

	wlog.Debugf("NotifyWrite: ID=%d Result=%d", cb, result)
	ch <- result
}
