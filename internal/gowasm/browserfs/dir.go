package browserfs

import (
	"io/fs"
	"log"
	"syscall"
)

var (
	_ fs.File = (*dirFile)(nil)
)

type dirFile struct {
	attrs inode
	name  string
}

func (f dirFile) Stat() (fs.FileInfo, error) {
	log.Printf("dirFile.Stat: %q", f.name)
	return newFileInfo(f.attrs), nil
}

func (f dirFile) Read(_ []byte) (int, error) {
	log.Printf("dirFile.Read: %q", f.name)
	return 0, &fs.PathError{
		Op:   "read",
		Path: f.name,
		Err:  syscall.EISDIR,
	}
}

func (f dirFile) Close() error {
	log.Printf("dirFile.Close: %q", f.name)
	return nil
}
