package goplay

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestFileSet(t *testing.T) {
	fset := NewFileSet(1024)
	files := []struct {
		name    string
		content string
	}{
		{
			"main.go", "package main\n\nfunc main() {\n\tprintln(\"Hello\")\n}",
		},
		{
			"go.mod", "module playground",
		},
		{
			"foo/foo.go", "package foo\n\nfunc Bar() {\n\tprintln(\"Bar\")\n}",
		},
	}

	for _, entry := range files {
		require.NoError(t, fset.Add(entry.name, strings.NewReader(entry.content)))
	}

	expected := fmt.Sprintf(
		"--- main.go ---\n%s\n--- go.mod ---\n%s\n--- foo/foo.go ---\n%s\n",
		files[0].content, files[1].content, files[2].content,
	)

	got := fset.Bytes()
	require.Equal(t, expected, string(got))
}
