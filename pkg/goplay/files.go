package goplay

import (
	"bytes"
	"fmt"
	"io"
	"path/filepath"
	"strings"
)

// FileSet is a helper to construct a Go playground request from multiple Go files.
type FileSet struct {
	duplicates map[string]struct{}
	buf        *bytes.Buffer
}

func NewFileSet(bufSize int) FileSet {
	buff := new(bytes.Buffer)
	buff.Grow(bufSize)
	return FileSet{
		buf:        buff,
		duplicates: make(map[string]struct{}),
	}
}

// Add adds a file to the buffer.
func (f FileSet) Add(name string, src io.Reader) error {
	if closer, ok := src.(io.Closer); ok {
		defer closer.Close()
	}

	name = strings.TrimSpace(name)
	if _, ok := f.duplicates[name]; ok {
		return fmt.Errorf("duplicate file name %q", name)
	}

	switch ext := filepath.Ext(name); ext {
	case ".go", ".mod":
		break
	default:
		return fmt.Errorf("unsupported file type: %q", name)
	}

	f.duplicates[name] = struct{}{}
	f.buf.WriteString("--- ")
	f.buf.WriteString(name)
	f.buf.WriteString(" ---\n")
	n, err := io.Copy(f.buf, src)
	if err != nil {
		return fmt.Errorf("cannot read file %q: %w", name, err)
	}
	if n == 0 {
		return fmt.Errorf("file %q is empty", name)
	}

	if !f.hasTrailingNewline() {
		f.buf.WriteByte('\n')
	}
	return nil
}

func (f FileSet) Bytes() []byte {
	return f.buf.Bytes()
}

func (f FileSet) String() string {
	return f.buf.String()
}

func (f FileSet) hasTrailingNewline() bool {
	buff := f.buf.Bytes()
	if len(buff) == 0 {
		return false
	}

	return buff[len(buff)-1] == '\n'
}
