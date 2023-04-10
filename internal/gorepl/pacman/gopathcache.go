package pacman

import (
	"fmt"
	"io"
	"io/fs"
	"path"
	"strings"

	"golang.org/x/mod/module"
)

var _ PackageCache = (*SimpleFSCache)(nil)

const (
	defaultFileMode = 0644
	defaultDirMode  = 0755
)

type WritableFS interface {
	// Stat returns file or directory info
	Stat(name string) (fs.FileInfo, error)

	// WriteFile creates a new file or replaces file contents.
	WriteFile(name string, data io.Reader, mode fs.FileMode) error

	// Mkdir creates a directory named path, along with any necessary
	// parents, and returns nil, or else returns an error.
	Mkdir(name string, mode fs.FileMode) error

	// Remove removes specified item and all children files.
	Remove(name string) error
}

type PackageIndex interface {
	// LookupPackage retrieve a package from index.
	//
	// Returns fs.ErrNotExists if package not found.
	LookupPackage(pkgName string) (*module.Version, error)

	// RegisterPackage adds package to the index.
	RegisterPackage(pkg *module.Version) error

	// RemovePackage removes package from index.
	RemovePackage(pkg *module.Version) error
}

// SimpleFSCache is a simple gopath-like package cache.
//
// Doesn't support package versioning.
type SimpleFSCache struct {
	location string

	fs    WritableFS
	index PackageIndex
}

func NewSimpleFSCache(location string, fs WritableFS, index PackageIndex) *SimpleFSCache {
	return &SimpleFSCache{location: location, fs: fs, index: index}
}

func (c SimpleFSCache) TestImportPath(importPath string) error {
	p := path.Join(c.location, importPath)
	_, err := c.fs.Stat(p)
	if err != nil {
		return err
	}

	return nil
}

func (c SimpleFSCache) LookupPackage(pkgName string) (*module.Version, error) {
	return c.index.LookupPackage(pkgName)
}

func (c SimpleFSCache) RegisterPackage(pkg *module.Version) error {
	return c.index.RegisterPackage(pkg)
}

func (c SimpleFSCache) WritePackageFile(pkg *module.Version, filePath string, f fs.File) error {
	// Keep packages in the same structure as GOPATH without version suffix.
	// Same packages of different versions are not supported.
	realPath := path.Join(c.location, removeVersionFromPath(pkg, filePath))

	if err := c.fs.Mkdir(path.Dir(realPath), defaultDirMode); err != nil {
		return err
	}

	return c.fs.WriteFile(realPath, f, defaultFileMode)
}

func (c SimpleFSCache) RemovePackage(pkg *module.Version) error {
	if err := c.index.RemovePackage(pkg); err != nil {
		return fmt.Errorf("failed to remove package %s from index: %w", pkg, err)
	}

	pkgPath := path.Join(c.location, pkg.Path)
	if err := c.fs.Remove(pkgPath); err != nil {
		return fmt.Errorf("failed to remove package %s from storage: %w", pkgPath, err)
	}

	return nil
}

// removeVersionFromPath removes package version segment from path.
//
// Example: foo/bar@v1.2.3/baz -> foo/bar/baz
func removeVersionFromPath(module *module.Version, fpath string) string {
	return strings.Replace(fpath, "@"+module.Version, "", 1)
}
