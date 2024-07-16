//go:build wasm

// The Go testing package contains a benchmarking facility
// that can be used to examine the performance of your Go code.
//
// Benchmarks are placed inside _test.go files and follow the rules of their Test counterparts.
//
// See: https://dave.cheney.net/2013/06/30/how-to-write-benchmarks-in-go
package main

// **Important:** This benchmark will be executed using WebAssembly as original Go Playground API doesn't support benchmarks and fuzzing.
// See: https://stackoverflow.com/questions/54574814/go-benchmark-run-from-main-go-playground

import "testing"

// In this example we’re going to benchmark the speed of computing the 10th number in the Fibonacci series.
func Fib(n int) int {
	if n < 2 {
		return n
	}
	return Fib(n-1) + Fib(n-2)
}

// Writing a benchmark is very similar to writing a test as they share the infrastructure from the testing package.
// Benchmark functions start with Benchmark.
//
// Benchmark functions are run several times by the testing package.
// The value of b.N will increase each time until the benchmark runner is satisfied with the stability of the benchmark.

var result int

func BenchmarkFib(b *testing.B) {
	var r int
	for n := 0; n < b.N; n++ {
		// always record the result of Fib to prevent
		// the compiler eliminating the function call.
		r = Fib(10)
	}
	// always store the result to a package level variable
	// so the compiler cannot eliminate the Benchmark itself.
	result = r
}
