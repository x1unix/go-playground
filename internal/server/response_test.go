package server

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestFilesPayload_HasUnitTests(t *testing.T) {
	cases := map[string]struct {
		input  FilesPayload
		expect bool
	}{
		"regular files": {
			expect: false,
			input: FilesPayload{
				Files: map[string]string{
					"main.go": "",
				},
			},
		},
		"test files": {
			expect: true,
			input: FilesPayload{
				Files: map[string]string{
					"main.go":      "",
					"main_test.go": "",
				},
			},
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			require.Equal(t, c.expect, c.input.HasUnitTests())
		})
	}
}

func TestFilesPayload_Validate(t *testing.T) {
	cases := map[string]struct {
		input   FilesPayload
		inputFn func() FilesPayload
		err     string
	}{
		"normal project files": {
			input: FilesPayload{
				Files: map[string]string{
					"main.go": "package main",
					"go.mod":  "module foo",
				},
			},
		},
		"has empty file": {
			err: `empty file "main.go"`,
			input: FilesPayload{
				Files: map[string]string{
					"main.go":      "",
					"main_test.go": "xxxxx",
				},
			},
		},
		"empty list": {
			err: "empty file list",
		},
		"unknown file": {
			err: `invalid file type: "main.txt"`,
			input: FilesPayload{
				Files: map[string]string{
					"main.txt":     "asdasd",
					"main_test.go": "xxxxx",
				},
			},
		},
		"file limit": {
			err: fmt.Sprintf("too many files (max: %d)", maxFilesCount),
			inputFn: func() FilesPayload {
				out := FilesPayload{Files: make(map[string]string, maxFilesCount)}
				for i := 0; i < maxFilesCount+1; i++ {
					key := fmt.Sprintf("file%d.go", i)
					out.Files[key] = "supercalifragilisticexpialidocious"
				}

				return out
			},
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			input := c.input
			if c.inputFn != nil {
				input = c.inputFn()
			}

			err := input.Validate()
			if c.err == "" {
				require.NoError(t, err)
				return
			}

			require.EqualError(t, err, c.err)
		})
	}
}
