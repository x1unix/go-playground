// Package wlog implements a simple logging package for internal WASM workers use.
package wlog

import "log"

var (
	// stdLog is standard wasm workers logger.
	stdLog = log.New(StdLog, "", log.LstdFlags|log.Lshortfile)

	// debugLog is a separate logger for debug messages.
	debugLog = log.New(StdDebug, "[DEBUG] ", log.LstdFlags|log.Lshortfile|log.Lmsgprefix)
)

// L returns standard log instance.
func L() *log.Logger {
	return stdLog
}

// D returns debug log instance.
func D() *log.Logger {
	return debugLog
}

func Debugf(format string, v ...any) {
	debugLog.Printf(format, v...)
}

func Debugln(v ...any) {
	debugLog.Println(v...)
}

func Debug(v ...any) {
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
