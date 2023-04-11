package uihost

//go:generate go run ../../../tools/gowasm-gen-import $GOFILE

//gowasm:import
func onPackageManagerEvent(e packageManagerEvent)
