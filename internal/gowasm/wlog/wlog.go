// Package wlog implements a simple logging package for internal WASM workers use.
package wlog

import (
	"fmt"
	"log"
	"os"
	"strconv"
)

var (
	// stdLog is standard wasm workers logger.
	stdLog = log.New(StdLog, "", log.LstdFlags|log.Lshortfile)

	// debugLog is a separate logger for debug messages.
	debugLog = log.New(StdDebug, "[DEBUG] ", log.LstdFlags|log.Lshortfile|log.Lmsgprefix)

	debugLogEnabled = checkDebugLogParam()
)

const callerSkip = 2

func Debugf(format string, v ...any) {
	if !debugLogEnabled {
		return
	}

	_ = debugLog.Output(callerSkip, fmt.Sprintf(format, v...))
}

func Debugln(v ...any) {
	if !debugLogEnabled {
		return
	}

	_ = debugLog.Output(callerSkip, fmt.Sprintln(v...))
}

func Debug(v ...any) {
	if !debugLogEnabled {
		return
	}

	_ = debugLog.Output(callerSkip, fmt.Sprint(v...))
}

func Printf(format string, v ...any) {
	_ = stdLog.Output(callerSkip, fmt.Sprintf(format, v...))
}

func Println(v ...any) {
	_ = stdLog.Output(callerSkip, fmt.Sprintln(v...))
}

func Print(v ...any) {
	_ = stdLog.Output(callerSkip, fmt.Sprint(v...))
}

func Fatal(v ...any) {
	_ = stdLog.Output(callerSkip, fmt.Sprint(v...))
	os.Exit(1)
}

func Fatalln(v ...any) {
	_ = stdLog.Output(callerSkip, fmt.Sprintln(v...))
	os.Exit(1)
}

func Fatalf(format string, v ...any) {
	_ = stdLog.Output(callerSkip, fmt.Sprintf(format, v...))
	os.Exit(1)
}

func Panic(v ...any) {
	msg := fmt.Sprint(v...)
	_ = stdLog.Output(callerSkip, msg)
	panic(msg)
}

func Panicln(v ...any) {
	msg := fmt.Sprintln(v...)
	_ = stdLog.Output(callerSkip, msg)
	panic(msg)
}

func Panicf(format string, v ...any) {
	msg := fmt.Sprintf(format, v...)
	_ = stdLog.Output(callerSkip, msg)
	panic(msg)
}

func checkDebugLogParam() bool {
	val, ok := os.LookupEnv("WASM_DEBUG")
	if !ok {
		return false
	}

	if val == "" {
		return false
	}

	isEnabled, err := strconv.ParseBool(val)
	if err != nil {
		Printf("Warning: failed to parse WASM_DEBUG environment variable: %s", err)
		return false
	}

	return isEnabled
}
