package goplay

import (
	"bytes"
	"fmt"
	"io"
	"strings"
)

// FileSet is a helper to construct a Go playground request from multiple Go files.
type FileSet struct {
	goSourceFiles  map[string][]byte
	otherFiles     map[string][]byte
	goFileOrder    []string
	otherFileOrder []string
	buf            *bytes.Buffer
	dirty          bool
}

func NewFileSet(bufSize int) *FileSet {
	buf := new(bytes.Buffer)
	buf.Grow(bufSize)

	return &FileSet{
		buf:            buf,
		goSourceFiles:  make(map[string][]byte),
		otherFiles:     make(map[string][]byte),
		goFileOrder:    make([]string, 0),
		otherFileOrder: make([]string, 0),
	}
}

// HasGoFiles returns whether a set contains at-least one ".go" file.
func (f *FileSet) HasGoFiles() bool {
	return len(f.goSourceFiles) > 0
}

// Add adds a file to the buffer.
func (f *FileSet) Add(name string, src []byte) error {
	if len(src) == 0 {
		return fmt.Errorf("file %q is empty", name)
	}

	name = strings.TrimSpace(name)
	isGoFile, err := ValidateFilePath(name, true)
	if err != nil {
		return err
	}

	var dstMap map[string][]byte
	var dstOrder *[]string
	if isGoFile {
		dstMap = f.goSourceFiles
		dstOrder = &f.goFileOrder
	} else {
		dstMap = f.otherFiles
		dstOrder = &f.otherFileOrder
	}

	if _, ok := dstMap[name]; ok {
		return fmt.Errorf("duplicate file name %q", name)
	}

	dstMap[name] = src
	*dstOrder = append(*dstOrder, name)
	f.buf.Reset()
	f.dirty = true
	return nil
}

func txtarAppendFile(buf *bytes.Buffer, fname string, data []byte) {
	buf.WriteString("-- ")
	buf.WriteString(fname)
	buf.WriteString(" --\n")
	buf.Write(data)

	// If contents doesn't end with line break - add it.
	// Required, as line break is txtar file separator.
	hasTrailingNewline := len(data) == 0 || data[len(data)-1] == '\n'
	if !hasTrailingNewline {
		buf.WriteByte('\n')
	}
}

func (f *FileSet) buildBuf() *bytes.Buffer {
	if !f.dirty {
		// Skip if buffer is populated.
		return f.buf
	}

	// First, write Go source files and then other files.
	// Upstream might misbehave if non-Go files come first.
	for _, fname := range f.goFileOrder {
		src := f.goSourceFiles[fname]
		txtarAppendFile(f.buf, fname, src)
	}

	for _, fname := range f.otherFileOrder {
		src := f.otherFiles[fname]
		txtarAppendFile(f.buf, fname, src)
	}

	f.dirty = false
	return f.buf
}

func (f *FileSet) Bytes() []byte {
	return f.buildBuf().Bytes()
}

func (f *FileSet) Reader() io.Reader {
	return f.buildBuf()
}
