package goplay

import (
	"bufio"
	"errors"
	"fmt"
	"path"
	"regexp"
	"strings"
)

var delimiterRegEx = regexp.MustCompile(`(?i)^-- (.*) --$`)

func cleanPath(pathname string) string {
	// path.Clean don't clean dots for non-abs paths
	s := path.Clean("/" + pathname)
	return strings.TrimPrefix(s, "/")
}

func validateFileName(name string) bool {
	if name == "go.mod" {
		return true
	}

	ext := path.Ext(name)
	return ext == ".go"
}

func ValidateFilePath(name string, strict bool) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return errors.New("file name cannot be empty")
	}

	if !strict {
		return nil
	}

	if strings.HasPrefix(name, "/") {
		return errors.New("file path cannot start with a slash")
	}

	if cleanPath(name) != name {
		return fmt.Errorf("invalid file name %q", name)
	}

	fileName := path.Base(name)
	if !validateFileName(fileName) {
		return fmt.Errorf("invalid file name %q", name)
	}

	return nil
}

func isSeparatorLine(line string) (string, bool) {
	matches := delimiterRegEx.FindAllStringSubmatch(line, 1)
	ok := len(matches) == 1
	if !ok {
		return "", false
	}

	return matches[0][1], true
}

type SplitFileOpts struct {
	// DefaultFileName is a file name to use of source string doesn't contain any file name.
	DefaultFileName string

	// CheckPaths enables file path format validation.
	CheckPaths bool
}

// SplitFileSet splits string that contains source for multiple files in Go playground format.
//
// The official Go Playground defines a format to pass multiple files in request.
// Every file has to be separated with a special line which contains file name.
//
// For example:
//
//	package main
//
//	func main() {
//		...
//	}
//	-- foo/foo.go --
//	package foo
//
//	func Foo() {
//		...
//	}
func SplitFileSet(src string, opts SplitFileOpts) (map[string]string, error) {
	files := make(map[string]string)

	currentFileName := opts.DefaultFileName
	if currentFileName == "" {
		currentFileName = "main.go"
	}

	lineBuffer := strings.Builder{}
	chunkCommitted := true
	isFirstLine := true
	scanner := bufio.NewScanner(strings.NewReader(src))
	for scanner.Scan() {
		line := scanner.Text()
		fileName, isFileLine := isSeparatorLine(line)
		if !isFileLine {
			isFirstLine = false
			if !chunkCommitted {
				lineBuffer.WriteRune('\n')
			}
			chunkCommitted = false
			lineBuffer.WriteString(line)
			continue
		}

		if err := ValidateFilePath(fileName, opts.CheckPaths); err != nil {
			return nil, err
		}

		// Skip commit if string starts with file delimiter
		if isFirstLine {
			currentFileName = fileName
			continue
		}

		// Commit previous chunk
		chunkCommitted = true
		files[currentFileName] = lineBuffer.String()
		lineBuffer.Reset()

		isFirstLine = false
		currentFileName = fileName
		if _, ok := files[fileName]; ok {
			return nil, fmt.Errorf("duplicate file entry: %q", fileName)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}

	if !chunkCommitted {
		// HACK: preserve trailing newline
		if strings.HasSuffix(src, "\n") {
			lineBuffer.WriteRune('\n')
		}
		files[currentFileName] = lineBuffer.String()
	}

	return files, nil
}
