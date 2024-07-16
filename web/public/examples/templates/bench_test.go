package main

import "testing"

func doJob() {
	// Put here code to benchmark
}

func BenchmarkFoo(b *testing.B) {
	for n := 0; n < b.N; n++ {
		doJob()
	}
}
