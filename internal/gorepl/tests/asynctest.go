package tests

import (
	"fmt"
	"github.com/x1unix/go-playground/internal/gowasm"
)

func doABarrelRoll(cbId int)

func RunTestAsync() {

	fmt.Println("go: requesting callback")
	cb := gowasm.RequestCallback()

	fmt.Println("go: testing callback", cb)
	go func() {
		fmt.Println("starting a barrel roll")
		doABarrelRoll(cb)
	}()

	fmt.Println("go: waiting to callback", cb)
	result := gowasm.AwaitCallback(cb)

	fmt.Println("go: Got result:", result)
	fmt.Println("go: releasing callback", cb)
	gowasm.ReleaseCallback(cb)
}
