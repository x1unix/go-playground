package browserfs

import (
	"io/fs"
	"syscall"

	"github.com/x1unix/go-playground/internal/gowasm/wlog"
)

var (
	_ fs.File = (*dirFile)(nil)
)

type dirFile struct {
	attrs inode
	name  string
}

func (f dirFile) Stat() (fs.FileInfo, error) {
	wlog.Debugf("dirFile.Stat: %q", f.name)
	return newFileInfo(f.attrs), nil
}

func (f dirFile) Read(_ []byte) (int, error) {
	wlog.Debugf("dirFile.Read: %q", f.name)
	return 0, &fs.PathError{
		Op:   "read",
		Path: f.name,
		Err:  syscall.EISDIR,
	}
}

func (f dirFile) Close() error {
	wlog.Debugf("dirFile.Close: %q", f.name)
	return nil
}
