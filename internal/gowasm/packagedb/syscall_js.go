package packagedb

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm/packagedb.registerPackage
func lookupPackage(pkgName string, out *[]byte, cb int)

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm/packagedb.lookupPackage
func registerPackage(pkgName, version string, cb int)

//go:wasmimport gojs github.com/x1unix/go-playground/internal/gowasm/packagedb.removePackage
func removePackage(pkgName string, cb int)
