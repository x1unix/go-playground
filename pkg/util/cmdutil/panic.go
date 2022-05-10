package cmdutil

import (
	"fmt"
	"os"
)

// FatalOnError prints error to stderr and shuts down the application.
//
// Used when logging facility isn't initialized yet.
//
// Does nothing if passed error is nil.
func FatalOnError(err error) {
	if err == nil {
		return
	}

	_, _ = fmt.Fprintln(os.Stderr, "Fatal error:", err)
	os.Exit(1)
}
