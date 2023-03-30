package browserfs

import (
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"
)

var _ fs.ReadDirFS = (*FS)(nil)

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
