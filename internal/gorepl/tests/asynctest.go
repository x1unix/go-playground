package tests

import "fmt"

func requestAtomic() uintptr
func waitForEvent(ref uintptr, timeout int32) int32
func releaseAtomic(ref uintptr)
func testAtomic(ref uintptr)

func RunTestAsync() {
	fmt.Println("requesting new atomic ref")
	refId := requestAtomic()
	fmt.Println("requested atomic", refId)
	fmt.Println("firing test event")
	testAtomic(refId)
	fmt.Println("waiting for event")
	result := waitForEvent(refId, 5000)
	fmt.Println("got result:", result)
	fmt.Println("releasing atomic...")
	releaseAtomic(refId)
}
