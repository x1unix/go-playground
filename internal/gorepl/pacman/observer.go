package pacman

import "golang.org/x/mod/module"

type Progress struct {
	Total   int
	Current int
}

// PMProgressObserver capture progress events from package manager
type PMProgressObserver interface {
	// DependencyCheckFinish is fired when dependency check finished or stopped due to error.
	DependencyCheckFinish(err error)

	// DependencyResolveStart is called at the beginning of dependency resolve process.
	//
	// Accepts required packages count.
	DependencyResolveStart(packagesCount int)

	// PackageSearchStart is called when package manager starts searching for package.
	PackageSearchStart(pkgName string)

	// PackageDownload called during package download progress
	PackageDownload(pkg *module.Version, progress Progress)

	// PackageExtract called during package extraction progress
	PackageExtract(pkg *module.Version, progress Progress)
}

type noopProgressObserver struct{}

func (o noopProgressObserver) DependencyCheckFinish(err error) {
}

func (o noopProgressObserver) DependencyResolveStart(packagesCount int) {
}

func (o noopProgressObserver) PackageSearchStart(pkgName string) {
}

func (o noopProgressObserver) DependencyLookupFailed(pkgName string, err error) {
}

func (o noopProgressObserver) PackageDownload(pkg *module.Version, progress Progress) {
}

func (o noopProgressObserver) PackageExtract(pkg *module.Version, progress Progress) {
}
