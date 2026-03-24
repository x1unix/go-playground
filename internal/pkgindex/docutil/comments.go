package docutil

import (
	"bytes"
	"go/ast"
	"go/doc/comment"
	"strconv"
	"strings"
	"unicode"
	"unicode/utf8"
)

const (
	pkgDocPrefix = "package "
	goDocBaseUrl = "https://pkg.go.dev/"

	// Char count of static markup chars from writeGoDocLink.
	goDocCharsLen = 22
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

	sb.WriteRune('`')
	sb.WriteString(importPath)
	sb.WriteRune('`')
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
		printer = comment.Printer{
			DocLinkBaseURL: goDocBaseUrl,
			HeadingID:      func(*comment.Heading) string { return "" },
		}
	)

	str := group.Text()
	parsedDoc := parser.Parse(str)
	replacements := replaceDocLinks(parsedDoc)
	mdDoc := printer.Markdown(parsedDoc)
	mdDoc = applyReplacements(mdDoc, replacements)
	mdDoc = bytes.TrimSuffix(mdDoc, []byte("\n"))
	return mdDoc
}

func replaceDocLinks(doc *comment.Doc) map[string]string {
	if doc == nil || len(doc.Content) == 0 {
		return nil
	}

	replacements := make(map[string]string)
	nextID := 0
	for i := range doc.Content {
		doc.Content[i] = replaceDocLinksInBlock(doc.Content[i], replacements, &nextID)
	}

	return replacements
}

func replaceDocLinksInBlock(block comment.Block, replacements map[string]string, nextID *int) comment.Block {
	switch block := block.(type) {
	case *comment.Paragraph:
		block.Text = replaceDocLinksInText(block.Text, replacements, nextID)
	case *comment.Heading:
		block.Text = replaceDocLinksInText(block.Text, replacements, nextID)
	case *comment.List:
		for _, item := range block.Items {
			for i := range item.Content {
				item.Content[i] = replaceDocLinksInBlock(item.Content[i], replacements, nextID)
			}
		}
	}

	return block
}

func replaceDocLinksInText(text []comment.Text, replacements map[string]string, nextID *int) []comment.Text {
	out := make([]comment.Text, 0, len(text))
	for _, t := range text {
		switch t := t.(type) {
		case *comment.DocLink:
			token := "@@DOCUTILLINK" + strconv.Itoa(*nextID) + "@@"
			*nextID = *nextID + 1
			replacements[token] = "`" + extractText(t.Text) + "`"
			out = append(out, comment.Plain(token))
		case *comment.Link:
			t.Text = replaceDocLinksInText(t.Text, replacements, nextID)
			out = append(out, t)
		case comment.Plain:
			out = append(out, replacePlainSymbolRefs(string(t), replacements, nextID)...)
		default:
			out = append(out, t)
		}
	}

	return out
}

func extractText(text []comment.Text) string {
	var sb strings.Builder
	for _, t := range text {
		switch t := t.(type) {
		case comment.Plain:
			sb.WriteString(string(t))
		case comment.Italic:
			sb.WriteString(string(t))
		case *comment.DocLink:
			sb.WriteString(extractText(t.Text))
		case *comment.Link:
			sb.WriteString(extractText(t.Text))
		}
	}

	return sb.String()
}

func replacePlainSymbolRefs(text string, replacements map[string]string, nextID *int) []comment.Text {
	var out []comment.Text
	start := 0
	for i := 0; i < len(text); i++ {
		if text[i] != '[' {
			continue
		}

		end := strings.IndexByte(text[i+1:], ']')
		if end == -1 {
			break
		}
		end += i + 1
		ref := text[i+1 : end]
		if !isBoundaryBefore(text, i) || !isBoundaryAfter(text, end+1) || !isSymbolRef(ref) {
			continue
		}

		if start < i {
			out = append(out, comment.Plain(text[start:i]))
		}

		token := "@@DOCUTILLINK" + strconv.Itoa(*nextID) + "@@"
		*nextID = *nextID + 1
		replacements[token] = "`" + ref + "`"
		out = append(out, comment.Plain(token))
		start = end + 1
		i = end
	}

	if start < len(text) {
		out = append(out, comment.Plain(text[start:]))
	}

	if len(out) == 0 {
		return []comment.Text{comment.Plain(text)}
	}

	return out
}

func isBoundaryBefore(text string, i int) bool {
	if i <= 0 {
		return true
	}

	r, _ := utf8.DecodeLastRuneInString(text[:i])
	return unicode.IsSpace(r) || unicode.IsPunct(r)
}

func isBoundaryAfter(text string, i int) bool {
	if i >= len(text) {
		return true
	}

	r, _ := utf8.DecodeRuneInString(text[i:])
	if r == '(' {
		return false
	}
	return unicode.IsSpace(r) || unicode.IsPunct(r)
}

func isSymbolRef(ref string) bool {
	if ref == "" {
		return false
	}

	if strings.ContainsAny(ref, " \t\n") {
		return false
	}

	if ref[0] == '*' {
		if len(ref) == 1 {
			return false
		}
		ref = ref[1:]
	}

	for _, part := range strings.FieldsFunc(ref, func(r rune) bool {
		return r == '.' || r == '/'
	}) {
		if part == "" {
			return false
		}

		r, size := utf8.DecodeRuneInString(part)
		if r == utf8.RuneError || !(unicode.IsLetter(r) || r == '_') {
			return false
		}

		for _, r := range part[size:] {
			if !unicode.IsLetter(r) && !unicode.IsDigit(r) && r != '_' {
				return false
			}
		}
	}

	return true
}

func applyReplacements(mdDoc []byte, replacements map[string]string) []byte {
	if len(replacements) == 0 {
		return mdDoc
	}

	out := string(mdDoc)
	for token, replacement := range replacements {
		out = strings.ReplaceAll(out, token, replacement)
	}

	return []byte(out)
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
		ok := 'a' <= b && b <= 'z' || '0' <= b && b <= '9'
		if !ok {
			return false
		}
	}
	return true
}
