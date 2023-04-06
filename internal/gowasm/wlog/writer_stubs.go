//go:build !js

package wlog

import (
	"io"
	"os"
)

var (
	StdLog   io.Writer = os.Stdout
	StdDebug io.Writer = os.Stderr
)
