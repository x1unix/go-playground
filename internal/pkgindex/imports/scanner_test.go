package imports

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestShouldIgnoreFileName(t *testing.T) {
	ignoredFiles := []string{
		"internal",
		"testdata",
		"foo_test.go",
		"bar_windows.go",
		"foo_darwin.go",
		"foo_openbsd_arm64.go",
		"foo_netbsd_riscv64.go",
		"mmap_unix_test.go",
		"zerrors_linux_mips64.go",
	}

	allowFiles := []string{
		"foo.go",
		"foo_bar.go",
		"foo_js.go",
		"foo_wasm.go",
		"foo_js_wasm.go",
		"env_unix.go",
		"exec_linux.go",
		"zerrors_linux_amd64.go",
	}

	t.Run("ignore", func(t *testing.T) {
		for _, n := range ignoredFiles {
			require.True(t, shouldIgnoreFileName(n), n)
		}
	})

	t.Run("allow", func(t *testing.T) {
		for _, n := range allowFiles {
			require.False(t, shouldIgnoreFileName(n), n)
		}
	})
}
