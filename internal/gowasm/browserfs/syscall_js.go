package browserfs

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm/browserfs.stat
func stat(name string, out *inode, cb int)

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm/browserfs.readDir
func readDir(name string, out *[]inode, cb int)

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm/browserfs.readFile
func readFile(fid uint64, out *[]byte, cb int)

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm/browserfs.writeFile
func writeFile(name string, data []byte, cb int)

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm/browserfs.makeDir
func makeDir(name string, cb int)

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm/browserfs.unlink
func unlink(name string, cb int)
