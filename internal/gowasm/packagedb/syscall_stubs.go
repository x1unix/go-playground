//go:build !js

package packagedb

func lookupPackage(pkgName string, out *[]byte, cb int) {
	panic("not implemented")
}
func registerPackage(pkgName, version string, cb int) {
	panic("not implemented")
}
func removePackage(okgName string, cb int) {
	panic("not implemented")
}
