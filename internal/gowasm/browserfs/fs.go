package browserfs

import (
	"io"
	"io/fs"
	"path"
	"strings"
	"syscall"

	"github.com/samber/lo"
	"github.com/x1unix/go-playground/internal/gorepl/pacman"
	"github.com/x1unix/go-playground/internal/gowasm"
	"github.com/x1unix/go-playground/internal/gowasm/wlog"
	"github.com/x1unix/go-playground/internal/util/buffutil"
)

var (
	_ fs.ReadDirFS      = (*FS)(nil)
	_ pacman.WritableFS = (*FS)(nil)
)

var (
	buffPool     = buffutil.NewBufferPool()
	dirEntryPool = buffutil.NewSlicePool[inode](64)
)

type FS struct{}

func NewFS() FS {
	return FS{}
}

func (s FS) Stat(name string) (fs.FileInfo, error) {
	wlog.Debugf("fs.Stat - %q\n", name)
	cb := gowasm.RequestCallback()
	inode := new(inode)
	go stat(cleanPath(name), inode, cb)

	if err := awaitCallback(cb); err != nil {
		return nil, &fs.PathError{
			Op:   "stat",
			Path: name,
			Err:  err,
		}
	}

	return newFileInfo(*inode), nil
}

func (s FS) WriteFile(name string, src io.Reader, _ fs.FileMode) error {
	wlog.Debugf("fs.WriteFile - %q\n", name)
	buff := buffPool.Get()
	defer buff.Close()

	_, err := io.Copy(buff, src)
	if err != nil {
		return err
	}

	cb := gowasm.RequestCallback()
	go writeFile(cleanPath(name), buff.Bytes(), cb)
	if err := awaitCallback(cb); err != nil {
		return &fs.PathError{
			Op:   "create",
			Path: name,
			Err:  err,
		}
	}

	return nil
}

func (s FS) Mkdir(name string, _ fs.FileMode) error {
	wlog.Debugf("fs.Mkdir - %q\n", name)
	cb := gowasm.RequestCallback()
	go makeDir(cleanPath(name), cb)
	if err := awaitCallback(cb); err != nil {
		return &fs.PathError{
			Op:   "mkdir",
			Path: name,
			Err:  err,
		}
	}

	return nil
}

func (s FS) Remove(name string) error {
	wlog.Debugf("fs.Remove - %q\n", name)
	cb := gowasm.RequestCallback()
	go unlink(cleanPath(name), cb)
	if err := awaitCallback(cb); err != nil {
		return &fs.PathError{
			Op:   "unlink",
			Path: name,
			Err:  err,
		}
	}

	return nil
}

func (s FS) ReadDir(name string) ([]fs.DirEntry, error) {
	wlog.Debugf("fs.ReadDir - %q\n", name)
	cb := gowasm.RequestCallback()

	// Since it's impossible to access to Go's memory allocator at JS side,
	// the best way to obtain a slice of results is to pass a slice with
	// enough size to JS and reuse it later.
	//
	// Basically we follow the same rules as for CGO.
	results := dirEntryPool.Get()
	defer dirEntryPool.Put(results)
	go readDir(name, &results, cb)

	if err := awaitCallback(cb); err != nil {
		return nil, &fs.PathError{
			Op:   "readdir",
			Path: name,
			Err:  err,
		}
	}

	return lo.Map(results, func(item inode, _ int) fs.DirEntry {
		return newDirEntry(item)
	}), nil
}

func (s FS) Open(name string) (fs.File, error) {
	wlog.Debugf("fs.Open - %q\n", name)
	cb := gowasm.RequestCallback()
	attrs := inode{}
	go stat(name, &attrs, cb)

	if err := awaitCallback(cb); err != nil {
		return nil, &fs.PathError{
			Op:   "open",
			Path: name,
			Err:  err,
		}
	}

	if attrs.fileType == fileTypeDirectory {
		return dirFile{
			attrs: attrs,
			name:  name,
		}, nil
	}

	return newFile(name, attrs), nil
}

// mapSyscallError maps syscall error to fs errors.
//
// Returns original error when no match found.
func mapSyscallError(errno syscall.Errno) error {
	switch errno {
	case syscall.ENOENT:
		return fs.ErrNotExist
	case syscall.EEXIST:
		return fs.ErrExist
	case syscall.EBADF:
		return fs.ErrClosed
	case syscall.EPERM:
		return fs.ErrPermission
	default:
		return errno
	}
}

func awaitCallback(cb gowasm.CallbackID) error {
	defer gowasm.ReleaseCallback(cb)

	err := gowasm.AwaitCallback(cb)
	if err == nil {
		return nil
	}

	syscallErr, ok := err.(syscall.Errno)
	if !ok {
		return err
	}

	return mapSyscallError(syscallErr)
}

func cleanPath(p string) string {
	return strings.TrimPrefix(path.Clean(p), "/")
}
