package browserfs

import (
	"fmt"
	"io/fs"
	"syscall"
)

var (
	_ fs.File = (*dirFile)(nil)
	//_ fs.ReadDirFile (*dirFile)(nil)
)

type dirFile struct {
	attrs inode
	name  string
}

func (f dirFile) Stat() (fs.FileInfo, error) {
	fmt.Printf("dirFile.Stat: STUB - %q\n", f.name)
	return newFileInfo(f.attrs), nil
}

func (f dirFile) Read(_ []byte) (int, error) {
	//TODO implement me
	fmt.Printf("dirFile.Read: STUB - %q\n", f.name)
	return 0, &fs.PathError{
		Op:   "read",
		Path: f.name,
		Err:  syscall.EISDIR,
	}
}

func (f dirFile) Close() error {
	//TODO implement me
	fmt.Printf("dirFile.Close: STUB - %q\n", f.name)
	return nil
}
