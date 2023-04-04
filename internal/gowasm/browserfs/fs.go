package browserfs

import (
	"errors"
	"fmt"
	"github.com/x1unix/go-playground/internal/gorepl/storage"
	"io/fs"
	"path/filepath"
	"strings"
)

var (
	_ fs.ReadDirFS        = (*FS)(nil)
	_ storage.ReadWriteFS = (*FS)(nil)
)

type FS struct{}

func (s FS) ReadDir(name string) ([]fs.DirEntry, error) {
	fmt.Printf("fs.ReadDir - %q\n", name)
	return nil, nil
}

func (s FS) Open(name string) (fs.File, error) {
	fmt.Printf("fs.Open - %q\n", name)
	if !strings.HasPrefix(name, "src/main/vendor") {
		return nil, fs.ErrNotExist
	}

	isFile := len(filepath.Ext(name)) > 0
	if isFile {
		return nil, fs.ErrNotExist
	}

	//fs.FileInfoToDirEntry()

	return newFile(name, inode{
		id:       1,
		parentId: 0,
		fileType: fileTypeDirectory,
		name:     newSizedFileName(filepath.Base(name)),
	}), nil

}

func (s FS) WriteFile(name string, data []byte) error {
	fmt.Printf("fs.CreateFile: %q", name)
	return &fs.PathError{
		Op:   "write",
		Path: name,
		Err:  errors.New("not implemented"),
	}
}
