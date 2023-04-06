package browserfs

// JS functions linked to WASM module.
// See: syscall_js.s

func stat(name string, out *inode, cb int)
func readDir(name string, out []inode, cb int)
func readFile(f inode, out []byte, cb int)
func writeFile(name string, data []byte, cb int)
func makeDir(name string, cb int)
func unlink(name string, cb int)
