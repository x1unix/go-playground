//go:build !js

package pacman

import (
	"io"
	"io/fs"
	"os"

	"golang.org/x/mod/module"
)

var (
	_ PackageIndex = (*MemoryPackageIndex)(nil)
	_ WritableFS   = (*HostFS)(nil)
)

type MemoryPackageIndex struct {
	pkgCache map[string]*module.Version
}

func NewMemoryPackageIndex() *MemoryPackageIndex {
	return &MemoryPackageIndex{
		pkgCache: make(map[string]*module.Version, 10),
	}
}

func (c *MemoryPackageIndex) RegisterPackage(pkg *module.Version) error {
	c.pkgCache[pkg.Path] = pkg
	return nil
}

func (c *MemoryPackageIndex) LookupPackage(pkgName string) (*module.Version, error) {
	pkg, ok := c.pkgCache[pkgName]
	if !ok {
		return nil, fs.ErrNotExist
	}

	return pkg, nil
}

func (c *MemoryPackageIndex) RemovePackage(pkg *module.Version) error {
	delete(c.pkgCache, pkg.Path)
	return nil
}

type HostFS struct{}

func NewHostFS() HostFS {
	return HostFS{}
}

func (w HostFS) Stat(name string) (fs.FileInfo, error) {
	s, err := os.Stat(name)
	if err != nil {
		return nil, err
	}

	return s, nil
}

func (w HostFS) Mkdir(name string, mode fs.FileMode) error {
	return os.MkdirAll(name, mode)
}

func (w HostFS) Remove(name string) error {
	return os.RemoveAll(name)
}

func (w HostFS) WriteFile(name string, data io.Reader, mode fs.FileMode) error {
	f, err := os.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, mode)
	if err != nil {
		return err
	}

	defer f.Close()
	_, err = io.Copy(f, data)
	return err
}
