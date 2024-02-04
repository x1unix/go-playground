package goplay

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSplitFileSet(t *testing.T) {
	tests := map[string]struct {
		src             string
		defaultFileName string
		expected        map[string]string
		expectError     bool
	}{
		"Multiple files": {
			src:             "-- main.go --\npackage main\n\nfunc main() {}\n-- go.mod --\nmodule example\n-- foo/bar.go --\npackage foo",
			defaultFileName: "init.go",
			expected: map[string]string{
				"main.go":    "package main\n\nfunc main() {}",
				"go.mod":     "module example",
				"foo/bar.go": "package foo",
			},
			expectError: false,
		},
		"Default file name": {
			src:             "package main\n\nfunc main() {}\n-- foo.go --\npackage foo",
			defaultFileName: "init.go",
			expected: map[string]string{
				"init.go": "package main\n\nfunc main() {}",
				"foo.go":  "package foo",
			},
			expectError: false,
		},
		"No delimiters": {
			src:             "package main\n\nfunc foo() {\n...\n}",
			defaultFileName: "example.go",
			expected: map[string]string{
				"example.go": "package main\n\nfunc foo() {\n...\n}",
			},
			expectError: false,
		},
		"Preserve newline": {
			src:             "package main\n\nfunc foo() {\n...\n}\n",
			defaultFileName: "example.go",
			expected: map[string]string{
				"example.go": "package main\n\nfunc foo() {\n...\n}\n",
			},
			expectError: false,
		},
		"Duplicate file name": {
			src:             "-- main.go --\npackage main\n\nfunc main() {}\n-- main.go --\npackage main",
			defaultFileName: "init.go",
			expectError:     true,
		},
		"Empty file name": {
			src:             "--  --\npackage main\n\nfunc main() {}",
			defaultFileName: "init.go",
			expectError:     true,
		},
		"Relative elements in file path": {
			src:             "-- ../main.go --\npackage main\n\nfunc main() {}",
			defaultFileName: "init.go",
			expectError:     true,
		},
		"File path starting with a slash": {
			src:             "-- /main.go --\npackage main\n\nfunc main() {}",
			defaultFileName: "init.go",
			expectError:     true,
		},
		"Unsupported file": {
			src:             "-- main.go2 --\npackage main\n\nfunc main() {}",
			defaultFileName: "init.go",
			expectError:     true,
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			result, err := SplitFileSet(tt.src, SplitFileOpts{
				DefaultFileName: tt.defaultFileName,
				CheckPaths:      true,
			})
			if tt.expectError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				require.Equal(t, tt.expected, result)
			}
		})
	}
}
