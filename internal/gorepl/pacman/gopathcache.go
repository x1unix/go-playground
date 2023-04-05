package pacman

import (
	"golang.org/x/mod/module"
	"io"
	"io/fs"
)

//var _ PackageCache = (*GoPathCache)(nil)

type WritableFS interface {
	Stat(name string) (fs.FileInfo, error)
	WriteFile(name string, data io.Reader) error
	Remove(name string) error
}

// GoPathCache is a simple gopath-like package cache.
//
// Doesn't support package versioning.
type GoPathCache struct {
	goPathLocation  string
	vendorDirectory string

	fs WritableFS
}

func (cache GoPathCache) TestImportPath(importPath string) error {
	//TODO implement me
	panic("implement me")
}

func (cache GoPathCache) WritePackageFile(pkg *module.Version, filePath string, f fs.File) error {
	//TODO implement me
	panic("implement me")
}

func (cache GoPathCache) RemovePackage(pkg *module.Version) error {
	//TODO implement me
	panic("implement me")
}
