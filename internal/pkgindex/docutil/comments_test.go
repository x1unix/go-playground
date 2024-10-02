package docutil

import (
	"go/ast"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestIsPackageDoc(t *testing.T) {
	cases := map[string]struct {
		expect bool
		group  *ast.CommentGroup
	}{
		"bufio": {
			expect: true,
			group: &ast.CommentGroup{
				List: []*ast.Comment{
					{
						Slash: 161,
						Text:  "// Package bufio implements buffered I/O. It wraps an io.Reader or io.Writer",
					},
					{
						Slash: 238,
						Text:  "// object, creating another object (Reader or Writer) that also implements",
					},
					{
						Slash: 313,
						Text:  "// the interface but provides buffering and some help for textual I/O.",
					},
				},
			},
		},
		"syscall": {
			// issue #367
			expect: false,
			group: &ast.CommentGroup{
				List: []*ast.Comment{
					{
						Slash: 161,
						Text:  "// mkasm.go generates assembly trampolines to call library routines from Go.",
					},
					{
						Slash: 238,
						Text:  "// This program must be run after mksyscall.pl.",
					},
				},
			},
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			got := IsPackageDoc(c.group)
			require.Equal(t, c.expect, got)
		})
	}
}

func TestFormatCommentGroup(t *testing.T) {
	want := "Package bufio implements buffered I/O. It wraps an io.Reader or io.Writer object, creating another object" +
		" (Reader or Writer) that also implements the interface but provides buffering and some help for textual I/O."
	input := &ast.CommentGroup{
		List: []*ast.Comment{
			{
				Slash: 161,
				Text:  "// Package bufio implements buffered I/O. It wraps an io.Reader or io.Writer",
			},
			{
				Slash: 238,
				Text:  "// object, creating another object (Reader or Writer) that also implements",
			},
			{
				Slash: 313,
				Text:  "// the interface but provides buffering and some help for textual I/O.",
			},
		},
	}

	got := FormatCommentGroup(input)
	require.Equal(t, want, string(got))
}
