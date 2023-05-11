package browserfs

import (
	"io"
	"io/fs"
	"sync"

	"github.com/x1unix/go-playground/internal/gowasm"
	"github.com/x1unix/go-playground/internal/gowasm/wlog"
)

var _ fs.File = (*file)(nil)

type file struct {
	attrs inode
	name  string

	lock        sync.Mutex
	initialized bool
	closed      bool
	data        []byte
}

func newFile(name string, attrs inode) *file {
	return &file{
		name:  name,
		attrs: attrs,
	}
}

func (f *file) Stat() (fs.FileInfo, error) {
	wlog.Debugf("file.Stat: %q", f.name)
	return newFileInfo(f.attrs), nil
}

func (f *file) Read(dst []byte) (int, error) {
	wlog.Debugf("file.Read: %q", f.name)
	if err := f.prefetchData(); err != nil {
		return 0, err
	}

	if f.eof() {
		return 0, io.EOF
	}

	n := 0
	if l := len(dst); l > 0 {
		for n < l {
			dst[n] = f.readByte()
			n++
			if f.eof() {
				// free memory
				f.data = []byte{}
				break
			}
		}
	}

	return n, nil
}

func (f *file) eof() bool {
	return len(f.data) == 0
}

func (f *file) readByte() byte {
	// this function assumes that eof() check was done before
	b := f.data[0]
	f.data = f.data[1:]
	return b
}

func (f *file) prefetchData() error {
	f.lock.Lock()
	defer f.lock.Unlock()

	if f.closed {
		return &fs.PathError{
			Op:   "read",
			Path: f.name,
			Err:  fs.ErrClosed,
		}
	}

	if f.initialized {
		return nil
	}

	// Fetch file contents into internal buffer
	f.data = make([]byte, 0, f.attrs.size)
	cb := gowasm.RequestCallback()
	go readFile(f.attrs.id, &f.data, cb)
	err := awaitCallback(cb)
	if err != nil {
		return &fs.PathError{
			Op:   "read",
			Path: f.name,
			Err:  err,
		}
	}

	f.initialized = true
	return nil
}

func (f *file) Close() error {
	wlog.Debugf("file.Close: %q", f.name)
	f.lock.Lock()
	defer f.lock.Unlock()

	if f.closed {
		return fs.ErrClosed
	}

	f.closed = true
	f.data = nil
	return nil
}
