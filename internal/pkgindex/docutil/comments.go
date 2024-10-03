package docutil

import (
	"bytes"
	"go/ast"
	"go/doc/comment"
	"strings"
	"unicode"
)

const (
	pkgDocPrefix = "package "
	goDocBaseUrl = "https://pkg.go.dev/"

	// Char count of static markup chars from writeGoDocLink.
	goDocCharsLen = 20
)

// BuildPackageDoc builds markdown documentation for package with a link to GoDoc page.
//
// Please call [IsPackageDoc] before using this method.
func BuildPackageDoc(group *ast.CommentGroup, importPath string) string {
	src := FormatCommentGroup(group)
	src = bytes.TrimSpace(src)

	return appendGoDocLink(src, importPath)
}

// EmptyPackageDoc returns empty package doc which only contains link to GoDoc.
func EmptyPackageDoc(importPath string) string {
	return appendGoDocLink(nil, importPath)
}

func appendGoDocLink(docStr []byte, importPath string) string {
	// Approx new buffer length. 20 is length of static characters.
	newLen := len(docStr) + len(importPath) + len(importPath) + len(goDocBaseUrl) + goDocCharsLen
	sb := new(strings.Builder)
	sb.Grow(newLen)
	sb.Write(docStr)

	// [pkgName on pkg.go.dev](https://pkg.go.dev/importPath)
	if len(docStr) > 0 {
		sb.WriteString("\n\n[")
	} else {
		sb.WriteString("[")
	}

	sb.WriteString(importPath)
	sb.WriteString(" on pkg.go.dev](")
	sb.WriteString(goDocBaseUrl)
	sb.WriteString(importPath)
	sb.WriteRune(')')
	return sb.String()
}

// FormatCommentGroup parses comments from AST and returns them in Markdown format.
func FormatCommentGroup(group *ast.CommentGroup) []byte {
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

// IsPackageDoc returns whether top level comment is a valid package comment.
//
// See issue #367.
func IsPackageDoc(group *ast.CommentGroup) bool {
	if group == nil || len(group.List) == 0 {
		return false
	}

	for _, comment := range group.List {
		c := strings.TrimPrefix(comment.Text, "//")
		c = strings.TrimPrefix(c, "/*")
		c = strings.TrimLeftFunc(c, unicode.IsSpace)
		if c == "" || isDirective(c) {
			continue
		}

		// We interested only in first non-empty comment.
		return hasPackagePrefix(c)
	}

	return false
}

func hasPackagePrefix(c string) bool {
	if len(c) < len(pkgDocPrefix) {
		return false
	}

	pfx := c[:len(pkgDocPrefix)]
	return strings.EqualFold(pfx, pkgDocPrefix)
}

// isDirective reports whether c is a comment directive.
//
// Copy from go/ast/ast.go:172
func isDirective(c string) bool {
	// "//line " is a line directive.
	// "//extern " is for gccgo.
	// "//export " is for cgo.
	// (The // has been removed.)
	if strings.HasPrefix(c, "line ") || strings.HasPrefix(c, "extern ") || strings.HasPrefix(c, "export ") {
		return true
	}

	// "//[a-z0-9]+:[a-z0-9]"
	// (The // has been removed.)
	colon := strings.Index(c, ":")
	if colon <= 0 || colon+1 >= len(c) {
		return false
	}
	for i := 0; i <= colon+1; i++ {
		if i == colon {
			continue
		}
		b := c[i]
		if !('a' <= b && b <= 'z' || '0' <= b && b <= '9') {
			return false
		}
	}
	return true
}
