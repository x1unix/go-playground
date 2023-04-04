package storage

import (
	"io/fs"
	"path"
	"strings"
)

const vendorDirPrefix = "src/main/vendor"

var (
	_ fs.ReadDirFS = (*PackageStorage)(nil)
)

// ReadWriteFS is superset of fs.FS which also allows creating new files
type ReadWriteFS interface {
	fs.ReadDirFS

	// WriteFile creates a new file or replacing contents of existing one.
	WriteFile(name string, data []byte) error
}

type PackageStorage struct {
	fs        fs.FS
	vendorDir string
}

func NewPackageStorage(parentFs fs.FS, goPath string) *PackageStorage {
	return &PackageStorage{
		fs:        parentFs,
		vendorDir: path.Join(goPath, vendorDirPrefix),
	}
}

func (p *PackageStorage) Open(name string) (fs.File, error) {
	// Ignore files outside of vendor prefix
	if !strings.HasPrefix(name, p.vendorDir) {
		return nil, fs.ErrNotExist
	}

	return p.fs.Open(name)
}

func (p *PackageStorage) ReadDir(name string) ([]fs.DirEntry, error) {
	//TODO implement me
	panic("implement me")
}
