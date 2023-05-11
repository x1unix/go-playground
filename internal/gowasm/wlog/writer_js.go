package wlog

import (
	"fmt"
	"io"
)

var (
	// StdLog is standard output for worker logs.
	StdLog io.Writer = newLogWriter(logLevelInfo)

	// StdDebug is debug output for worker logs.
	StdDebug io.Writer = newLogWriter(logLevelDebug)
)

//go:generate go run ../../../tools/gowasm-gen-import $GOFILE

//gowasm:import
func logWrite(level uint8, data []byte)

const (
	logLevelDebug = 0
	logLevelInfo  = 1
)

type logWriter struct {
	level uint8
}

func newLogWriter(level uint8) logWriter {
	return logWriter{level: level}
}

func (w logWriter) Write(data []byte) (n int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("logWrite: %s", r)
		}
	}()

	logWrite(w.level, data)
	return len(data), nil
}
