package browserfs

import (
	"io/fs"
	"time"
)

var _ fs.FileInfo = (*fileInfo)(nil)

type fileInfo struct {
	attrs inode
}

func newFileInfo(attrs inode) fileInfo {
	return fileInfo{
		attrs: attrs,
	}
}

func (f fileInfo) Name() string {
	return f.attrs.name.string()
}

func (f fileInfo) Size() int64 {
	return f.attrs.size
}

func (f fileInfo) Mode() fs.FileMode {
	switch f.attrs.fileType {
	case fileTypeDirectory:
		return fs.ModeDir | fs.ModePerm
	case fileTypeSymlink:
		return fs.ModeSymlink | fs.ModePerm
	default:
		return fs.ModePerm
	}
}

func (f fileInfo) ModTime() time.Time {
	return time.UnixMilli(f.attrs.createdAt)
}

func (f fileInfo) IsDir() bool {
	return f.attrs.fileType == fileTypeDirectory
}

func (f fileInfo) Sys() any {
	return f.attrs
}
