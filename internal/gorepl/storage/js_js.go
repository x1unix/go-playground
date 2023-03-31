//go:build js

package storage

import (
	"syscall/js"
)

type PackageInfo struct {
	Name    string
	Path    string
	Version string
}

func packageCreate(pkgInfo PackageInfo, cb js.Func)
func fileCreate(pkgInfo PackageInfo, name string, data []byte, cb js.Func)

type FileInfo struct {
	Name    string
	Size    int64
	IsDir   bool
	Mode    uint32
	ModTime int64
}

type FileEntry struct {
	PathName string
	FileInfo FileInfo
}

//type JSStorageWriter struct{}
//
//func (w JSStorageWriter) Create(fi FileEntry) {
//	tx := fileCreate(fi)
//	fmt.Println("Ref:", tx.id, "BuffSize:", tx.bufferSize)
//
//	awaitFn, ch := createAwait()
//	go fileCommit(32, awaitFn)
//	rsp := <-ch
//	fmt.Println("FileCommit Rsp:", rsp)
//}

type evalResult struct {
	value int
	err   error
}

func createAwait() (js.Func, <-chan evalResult) {
	ch := make(chan evalResult)
	fn := js.FuncOf(func(_ js.Value, args []js.Value) any {
		go func() {
			defer close(ch)
			result := args[0]
			err := args[1]
			if err.IsUndefined() || err.IsNull() {
				ch <- evalResult{value: result.Int()}
				return
			}

			ch <- evalResult{err: js.Error{Value: err}}
		}()
		return nil
	})

	return fn, ch
}
