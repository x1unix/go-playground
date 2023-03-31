package browserfs

import (
	"errors"
	"fmt"
	"io/fs"
)

var _ fs.File = (*file)(nil)

type file struct {
	attrs inode
	name  string
}

func newFile(name string, attrs inode) *file {
	return &file{
		name:  name,
		attrs: attrs,
	}
}

func (f *file) Stat() (fs.FileInfo, error) {
	fmt.Printf("file.Stat: STUB - %q (%s)\n", f.name, f.attrs.name.string())
	return newFileInfo(f.attrs), nil
}

func (f *file) Read(dst []byte) (int, error) {
	//TODO implement me
	fmt.Printf("file.Read: STUB - %q (%s)\n", f.name, f.attrs.name.string())
	return 0, errors.New("File.Read: STUB")
}

func (f *file) Close() error {
	//TODO implement me
	fmt.Printf("file.Close: STUB - %q\n", f.name)
	return errors.New("File.Close: STUB")
}
