package analyzer

import (
	"bytes"
	"go/ast"
	"go/doc/comment"
	"strings"
)

const (
	newLineChar = '\n'
	tabChar     = '\t'
)

var (
	mdCodeTag     = []byte("```\n")
	spaceIdent    = "  "
	spaceIdentLen = len(spaceIdent)
)

func isDocLine(line string) bool {
	// Source code in Go usually doc starts with tab char
	if line[0] == tabChar {
		return true
	}

	// Workaround for some packages with double space as doc indent (line "net/http")
	if (len(line) > spaceIdentLen) && (line[:spaceIdentLen] == spaceIdent) {
		return true
	}

	return false
}

// ParseCommentGroup parses comments from AST and returns them in Markdown format.
func ParseCommentGroup(group *ast.CommentGroup) []byte {
	if group == nil || len(group.List) == 0 {
		return nil
	}

	var (
		parser  comment.Parser
		printer comment.Printer
	)

	str := group.Text()
	parsedDoc := parser.Parse(str)
	mdDoc := printer.Markdown(parsedDoc)
	mdDoc = bytes.TrimSuffix(mdDoc, []byte("\n"))
	return mdDoc
}

// FormatDocString parses Go comment and returns a markdown-formatted string.
//
// Deprecated: use ParseCommentGroup instead.
func FormatDocString(str string) MarkdownString {
	if str == "" {
		return MarkdownString{Value: str}
	}

	w := strings.Builder{}
	docStart := false

	lines := strings.Split(str, "\n")
	for _, line := range lines {
		if len(line) == 0 {
			w.WriteRune(newLineChar)
			continue
		}

		// Source code in Go doc starts with tab char
		if isDocLine(line) {
			if !docStart {
				// Put markdown code section
				// if we met first source code line
				docStart = true
				w.Write(mdCodeTag)
			}

			w.WriteString(line)
			w.WriteRune(newLineChar)
			continue
		}

		// Else - regular text
		if docStart {
			// Terminate code block if previous
			// was open and not terminated
			docStart = false
			w.Write(mdCodeTag)
		}

		w.WriteString(line)
		w.WriteRune(newLineChar)
	}

	if docStart {
		// close markdown code block if wasn't closed
		w.Write(mdCodeTag)
	}

	return MarkdownString{
		Value: w.String(),
	}
}
