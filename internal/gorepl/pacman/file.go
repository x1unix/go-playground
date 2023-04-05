package pacman

import (
	"archive/zip"
	"io"
	"io/fs"
	"sync"
)

var _ fs.File = (*zipFSFile)(nil)

// zipFSFile is fs.File adapter for zip.File
type zipFSFile struct {
	file *zip.File

	lock   sync.Mutex
	reader io.ReadCloser
}

func newZipFSFile(src *zip.File) *zipFSFile {
	return &zipFSFile{
		file: src,
	}
}

func (z *zipFSFile) Stat() (fs.FileInfo, error) {
	return z.file.FileInfo(), nil
}

func (z *zipFSFile) Read(dst []byte) (int, error) {
	z.lock.Lock()
	defer z.lock.Unlock()

	if z.reader == nil {
		var err error
		z.reader, err = z.file.Open()
		if err != nil {
			return 0, err
		}
	}

	return z.reader.Read(dst)
}

func (z *zipFSFile) Close() error {
	z.lock.Lock()
	defer z.lock.Unlock()
	if z.reader == nil {
		return &fs.PathError{
			Op:   "close",
			Path: z.file.Name,
			Err:  fs.ErrClosed,
		}
	}

	err := z.reader.Close()
	z.reader = nil
	return err
}
