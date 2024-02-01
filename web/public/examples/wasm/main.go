// This tutorial introduces Go WebAssembly features.
//
// Go code can be compiled and ran in web browser as WebAssembly module.
// Go allows calling JavaScript functions from browser and also export functions to JavaScript.
package main

///////////////////////////////////////////////////////////////////////////////////////////////////////
// ⚠️ Attention: please select "WebAssembly" or "Go Interpreter" environment in top right corner.
///////////////////////////////////////////////////////////////////////////////////////////////////////

import (
	"fmt"

	"syscall/js"
)

func main() {
	// Get and print current web page URL and browser user agent string
	currentUrl := js.Global().Get("location").Call("toString")
	userAgent := js.Global().Get("navigator").Get("userAgent")

	fmt.Printf("Current URL:   %s\n", currentUrl)
	fmt.Printf("Your Browser:  %s\n", userAgent)
}
