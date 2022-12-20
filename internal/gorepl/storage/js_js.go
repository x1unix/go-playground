//go:build js

package storage

import (
	"fmt"
	"syscall/js"
)

func fileCreate(entry FileEntry) fileTx
func fileWrite(txId uint32, data []byte) int
func fileCommit(txId uint32, awaitFunc js.Func)

// func fileRollback(txId uint32, awaitFunc js.Func)

type fileTx struct {
	id         uint32
	bufferSize int32
}

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

type JSStorageWriter struct{}

func (w JSStorageWriter) Create(fi FileEntry) {
	tx := fileCreate(fi)
	fmt.Println("Ref:", tx.id, "BuffSize:", tx.bufferSize)

	awaitFn, ch := createAwait()
	go fileCommit(32, awaitFn)
	rsp := <-ch
	fmt.Println("FileCommit Rsp:", rsp)
}

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
