//go:build !js

package browserfs

// Stubs for native

func stat(name string, out *inode, cb int) {
	panic("not implemented")
}

func readDir(name string, out *[]inode, cb int) {
	panic("not implemented")
}

func readFile(fd uint64, out *[]byte, cb int) {
	panic("not implemented")
}

func writeFile(name string, data []byte, cb int) {
	panic("not implemented")
}

func makeDir(name string, cb int) {
	panic("not implemented")
}

func unlink(name string, cb int) {
	panic("not implemented")
}
