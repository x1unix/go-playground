package browserfs

//go:generate go run ../../../tools/gowasm-gen-import $GOFILE

//gowasm:import
func stat(name string, out *inode, cb int)

//gowasm:import
func readDir(name string, out *[]inode, cb int)

//gowasm:import
func readFile(fid uint64, out *[]byte, cb int)

//gowasm:import
func writeFile(name string, data []byte, cb int)

//gowasm:import
func makeDir(name string, cb int)

//gowasm:import
func unlink(name string, cb int)
