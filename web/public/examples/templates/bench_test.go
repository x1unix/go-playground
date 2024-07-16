//go:build wasm

package main

import "testing"

// **Important:** Benchmarks can't be ran on server as original Go Playground API doesn't support benchmarks and fuzzing.
// Please switch to WebAssembly environment using a button in the top right corner.
//
// See: https://stackoverflow.com/questions/54574814/go-benchmark-run-from-main-go-playground

func doJob() {
	// Put here code to benchmark
}

func BenchmarkFoo(b *testing.B) {
	for n := 0; n < b.N; n++ {
		doJob()
	}
}
