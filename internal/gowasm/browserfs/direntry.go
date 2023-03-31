package browserfs

import "io/fs"

var _ fs.DirEntry = (*dirEntry)(nil)

type dirEntry struct {
	fileInfo
}

func newDirEntry(attrs inode) dirEntry {
	return dirEntry{
		fileInfo: fileInfo{
			attrs: attrs,
		},
	}
}

func (d dirEntry) Type() fs.FileMode {
	switch d.attrs.fileType {
	case fileTypeDirectory:
		return fs.ModeDir
	case fileTypeSymlink:
		return fs.ModeSymlink
	default:
		return 0
	}
}

func (d dirEntry) Info() (fs.FileInfo, error) {
	return d.fileInfo, nil
}
