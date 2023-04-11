package gorepl

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/internal/gorepl/pacman"
)

func TestParseFileImports(t *testing.T) {
	want := []string{
		"go.uber.org/zap",
		"golang.org/x/tools/internal/imports",
	}
	sample := readTestdata(t, "sample.go.txt")

	v, err := pacman.ParseFileImports("sample.go.txt", "", sample)
	require.NoError(t, err)
	require.Equal(t, want, v)
}

func readTestdata(t *testing.T, name string) []byte {
	t.Helper()
	data, err := os.ReadFile(filepath.Join("testdata", name))
	require.NoError(t, err)
	return data
}
