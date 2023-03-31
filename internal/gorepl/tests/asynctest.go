package tests

import (
	"fmt"
	"syscall/js"
	"time"
)

func doABarrelRoll(cbId int)
func registerCallbackHandler(fn js.Func)

const maxSeats = 1024

var (
	callbacks  = make(map[int]chan int32, maxSeats)
	lastSeatID = 0
)

var callbackHandler = js.FuncOf(func(_ js.Value, args []js.Value) any {
	switch len(args) {
	case 0:
		panic("missing callback ID")
	case 1:
		panic("missing result value")
	}

	cbId := args[0].Int()
	result := args[0].Int()

	fmt.Println("go: got callback", cbId, result)
	ch, ok := callbacks[cbId]
	if !ok {
		panic(fmt.Sprint("invalid callback ID: ", cbId))
	}

	ch <- int32(result)
	return nil
})

func requestCallback() int {
	lastSeatID++
	seatID := lastSeatID
	ch := make(chan int32, 1)
	callbacks[seatID] = ch
	return seatID
}

func awaitCallback(cbId int) int32 {
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

func releaseCallback(cbId int) {
	ch, ok := callbacks[cbId]
	if !ok {
		panic("invalid callback ID")
	}

	close(ch)
	delete(callbacks, cbId)
}

func RunTestAsync() {
	fmt.Println("go: registering callback...")
	registerCallbackHandler(callbackHandler)

	fmt.Println("go: requesting callback")
	cb := requestCallback()

	fmt.Println("go: testing callback", cb)
	go func() {
		time.Sleep(time.Second)
		fmt.Println("starting a barrel roll")
		doABarrelRoll(cb)
	}()

	fmt.Println("go: waiting to callback", cb)
	result := awaitCallback(cb)

	fmt.Println("go: Got result:", result)
	fmt.Println("go: releasing callback", cb)
	releaseCallback(cb)
}

//func RunTestAsync() {
//	fmt.Println("requesting new atomic ref")
//	refId := requestAtomic()
//	fmt.Println("requested atomic", refId)
//	fmt.Println("firing test event")
//	testAtomic(refId)
//
//	fmt.Println("waiting for event")
//	now := time.Now()
//	result := waitForEvent(refId, 0)
//	diff := time.Now().Sub(now)
//	fmt.Println("got result:", result)
//	fmt.Println("duration", diff)
//	fmt.Println("releasing atomic...")
//	releaseAtomic(refId)
//	fmt.Println("FINISH!!!")
//}
