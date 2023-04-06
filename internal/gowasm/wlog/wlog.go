// Package wlog implements a simple logging package for internal WASM workers use.
package wlog

import (
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

func Debugf(format string, v ...any) {
	if !debugLogEnabled {
		return
	}

	debugLog.Printf(format, v...)
}

func Debugln(v ...any) {
	if !debugLogEnabled {
		return
	}

	debugLog.Println(v...)
}

func Debug(v ...any) {
	if !debugLogEnabled {
		return
	}

	debugLog.Print(v...)
}

func Printf(format string, v ...any) {
	stdLog.Printf(format, v...)
}

func Println(v ...any) {
	stdLog.Println(v...)
}

func Print(v ...any) {
	stdLog.Print(v...)
}

func Fatal(v ...any) {
	stdLog.Fatal(v...)
}

func Fatalln(v ...any) {
	stdLog.Fatalln(v...)
}

func Fatalf(format string, v ...any) {
	stdLog.Fatalf(format, v...)
}

func Panic(v ...any) {
	stdLog.Panic(v...)
}

func Panicln(v ...any) {
	stdLog.Panicln(v...)
}

func Panicf(format string, v ...any) {
	stdLog.Panicf(format, v...)
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
