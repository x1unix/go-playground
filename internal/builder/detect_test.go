package builder

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCheckFileEntries(t *testing.T) {
	cases := map[string]struct {
		input   map[string][]byte
		inputFn func() map[string][]byte
		expect  projectInfo
		err     string
	}{
		"empty entries": {
			input:  map[string][]byte{},
			expect: projectInfo{},
			err:    "no buildable Go source files",
		},
		"too many files": {
			inputFn: func() map[string][]byte {
				out := make(map[string][]byte)
				for i := 0; i < maxFileCount+1; i++ {
					key := fmt.Sprintf("file%d.go", i)
					out[key] = []byte("package main")
				}
				return out
			},
			err: fmt.Sprintf("too many files (max: %d)", maxFileCount),
		},
		"invalid file name": {
			input: map[string][]byte{
				"": nil,
			},
			err: "file name cannot be empty",
		},
		"empty file content": {
			input: map[string][]byte{
				"main.go": nil,
			},
			err: "file main.go is empty",
		},
		"valid single program file": {
			input: map[string][]byte{
				"main.go": []byte("package main"),
			},
			expect: projectInfo{
				projectType: projectTypeProgram,
			},
		},
		"valid single test file": {
			input: map[string][]byte{
				"main_test.go": []byte("package main"),
			},
			expect: projectInfo{
				projectType: projectTypeTest,
			},
		},
		"valid program project with subpackage": {
			input: map[string][]byte{
				"pkg/foo_test.go": []byte("package main"),
				"package.go":      []byte("package main"),
			},
			expect: projectInfo{
				projectType: projectTypeProgram,
			},
		},
		"valid test project with subpackage": {
			input: map[string][]byte{
				"pkg/main.go":  []byte("package main"),
				"util_test.go": []byte("package main"),
			},
			expect: projectInfo{
				projectType: projectTypeTest,
			},
		},
		"valid multiple files with test file": {
			input: map[string][]byte{
				"main.go":      []byte("package main"),
				"util_test.go": []byte("package main"),
			},
			expect: projectInfo{
				projectType: projectTypeTest,
			},
		},
		"detect fuzz and bench": {
			input: map[string][]byte{
				"bench_test.go": []byte("package main\nfunc BenchmarkFoo(b *testing.B) {\n}"),
				"fuzz_test.go":  []byte("package main\nfunc FuzzFoo(b *testing.F) {\n}"),
			},
			expect: projectInfo{
				projectType:  projectTypeTest,
				hasBenchmark: true,
				hasFuzz:      true,
			},
		},
		"file path too deep": {
			err: fmt.Sprintf("file path is too deep: %smain.go", strings.Repeat("dir/", maxPathDepth+1)),
			inputFn: func() map[string][]byte {
				key := strings.Repeat("dir/", maxPathDepth+1)
				key += "main.go"
				return map[string][]byte{
					key: []byte("package main"),
				}
			},
		},
	}

	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			input := tc.input
			if tc.inputFn != nil {
				input = tc.inputFn()
			}

			result, err := detectProjectType(input)
			if tc.err != "" {
				assert.Error(t, err)
				assert.EqualError(t, err, tc.err)
			} else {
				assert.NoError(t, err)
			}
			assert.Equal(t, tc.expect, result)
		})
	}
}
