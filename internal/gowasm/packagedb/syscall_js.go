package packagedb

//go:generate go run ../../../tools/gowasm-gen-import $GOFILE

//gowasm:import
func lookupPackage(pkgName string, out *[]byte, cb int)

//gowasm:import
func registerPackage(pkgName, version string, cb int)

//gowasm:import
func removePackage(pkgName string, cb int)
