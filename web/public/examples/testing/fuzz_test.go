//go:build wasm

// This tutorial introduces the basics of fuzzing in Go.
// With fuzzing, random data is run against your test in an attempt to find vulnerabilities or crash-causing inputs.
// Some examples of vulnerabilities that can be found by fuzzing are SQL injection, buffer overflow,
// denial of service and cross-site scripting attacks.
//
// See: https://go.dev/doc/tutorial/fuzz
package main

import (
	"errors"
	"testing"
	"unicode/utf8"
)

// **Important:** This test will be executed using WebAssembly as original Go Playground API doesn't support benchmarks and fuzzing.
// See: https://stackoverflow.com/questions/54574814/go-benchmark-run-from-main-go-playground

// This function will accept a string, loop over it a byte at a time, and return the reversed string at the end.
func Reverse(s string) (string, error) {
	if !utf8.ValidString(s) {
		return s, errors.New("input is not valid UTF-8")
	}

	// In order to preserve the UTF-8-encoded runes of the original string, we must instead reverse the string rune-by-rune.
	r := []rune(s)
	for i, j := 0, len(r)-1; i < len(r)/2; i, j = i+1, j-1 {
		r[i], r[j] = r[j], r[i]
	}
	return string(r), nil
}

// Unit tests have limitations, namely that each input must be added to the test by the developer.
// One benefit of fuzzing is that it comes up with inputs for your code, and may identify edge cases
// that the test cases you came up with didn’t reach.
func FuzzReverse(f *testing.F) {
	testcases := []string{"Hello, world", " ", "!12345"}
	for _, tc := range testcases {
		f.Add(tc) // Use f.Add to provide a seed corpus
	}

	// Fuzzing has a few limitations as well. In your unit test, you could predict the expected output
	// of the Reverse function, and verify that the actual output met those expectations.
	// When fuzzing, you can’t predict the expected output, since you don’t have control over the inputs.
	f.Fuzz(func(t *testing.T, orig string) {
		rev, err1 := Reverse(orig)
		if err1 != nil {
			return
		}
		doubleRev, err2 := Reverse(rev)
		if err2 != nil {
			return
		}
		if orig != doubleRev {
			t.Errorf("Before: %q, after: %q", orig, doubleRev)
		}
		if utf8.ValidString(orig) && !utf8.ValidString(rev) {
			t.Errorf("Reverse produced invalid UTF-8 string %q", rev)
		}
	})
}
