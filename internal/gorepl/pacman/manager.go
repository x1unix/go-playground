package pacman

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"regexp"
	"strings"

	"github.com/samber/lo"
	"github.com/x1unix/go-playground/internal/gowasm/wlog"
	"github.com/x1unix/go-playground/internal/util/buffutil"
	"github.com/x1unix/go-playground/internal/util/syncx"
	"github.com/x1unix/go-playground/pkg/goproxy"
	"golang.org/x/mod/modfile"
	"golang.org/x/mod/module"
	"golang.org/x/mod/semver"
)

var buffPool = buffutil.NewBufferPool()

var (
	versionBranchRegEx = regexp.MustCompile(`^v\d(.\d+)?(.\d+)?$`)
	goPkgInPackage     = regexp.MustCompile(`^[\w\d]+\.v\d(.\d+)?(.\d+)?$`)
)

type PackageCache interface {
	// TestImportPath tests if specified import path is accessible in cache.
	//
	// Returns fs.ErrNotExists in case of cache miss.
	TestImportPath(importPath string) error

	// LookupPackage checks if package is cached and returns its version.
	//
	// Returns fs.ErrNotExists if package is not cached.
	LookupPackage(pkgName string) (*module.Version, error)

	// RegisterPackage registers package in index
	RegisterPackage(pkg *module.Version) error

	// WritePackageFile writes a single file of package to the storage.
	WritePackageFile(pkg *module.Version, filePath string, f fs.File) error

	// RemovePackage removes all cached package files.
	RemovePackage(pkg *module.Version) error
}

type dependenciesJar map[string]*module.Version

func (j dependenciesJar) compareAndStore(m *module.Version) {
	oldVer, ok := j[m.Path]
	if !ok {
		j[m.Path] = m
		return
	}

	diff := semver.Compare(m.Version, oldVer.Version)
	if diff != -1 {
		j[m.Path] = m
	}
}

// PackageManager checks and stores program dependencies.
type PackageManager struct {
	goModProxy       *goproxy.Client
	cachedPaths      syncx.Map[string, *module.Version]
	pkgCache         PackageCache
	progressReporter PMProgressObserver
}

func NewPackageManager(modProxy *goproxy.Client, pkgCache PackageCache) *PackageManager {
	return &PackageManager{
		pkgCache:         pkgCache,
		goModProxy:       modProxy,
		cachedPaths:      syncx.NewMap[string, *module.Version](),
		progressReporter: noopProgressObserver{},
	}
}

// SetProgressObserver sets package manager event listener
func (mgr *PackageManager) SetProgressObserver(pm PMProgressObserver) {
	mgr.progressReporter = pm
}

// CheckDependencies checks if import paths are solvable and downloads dependencies if necessary.
func (mgr *PackageManager) CheckDependencies(ctx context.Context, importPaths []string) (err error) {
	newProjectPackages := lo.Filter(importPaths, func(item string, _ int) bool {
		if mgr.cachedPaths.Has(item) {
			return false
		}

		err := mgr.pkgCache.TestImportPath(item)
		if err != nil {
			if !os.IsNotExist(fs.ErrNotExist) {
				wlog.Printf("Warning: can't stat %q: %s", item, err)
			}
			return true
		}

		return false
	})

	wlog.Println("New packages:", len(newProjectPackages))
	if len(newProjectPackages) == 0 {
		return nil
	}

	defer mgr.progressReporter.DependencyCheckFinish(err)
	mgr.progressReporter.DependencyResolveStart(len(newProjectPackages))

	modsJar := make(dependenciesJar, len(newProjectPackages)*2)
	for _, pkg := range newProjectPackages {
		mgr.progressReporter.PackageSearchStart(pkg)
		if err := mgr.requestPackageByImportPath(ctx, pkg, modsJar); err != nil {
			return err
		}
	}

	for pkgName, ver := range modsJar {
		// Some indirect dependencies might require update.
		// Update them if necessary.
		if !mgr.shouldUpdatePackage(ver) {
			wlog.Printf("Package %s is already up to date, skip download...", ver)
			continue
		}

		if err := mgr.downloadModule(ctx, ver); err != nil {
			return err
		}

		mgr.cachedPaths.Put(pkgName, ver)
	}

	return nil
}

// shouldUpdatePackage checks if cached package version is outdated.
// Used to check the status of cached indirect dependencies (deps of deps).
func (mgr *PackageManager) shouldUpdatePackage(pkg *module.Version) bool {
	gotVer, err := mgr.pkgCache.LookupPackage(pkg.Path)
	if errors.Is(err, fs.ErrNotExist) {
		return true
	}
	if err != nil {
		wlog.Printf("LookupPackage failed for %q: %v", pkg.Path, err)
		return true
	}

	return isPackageOutdated(pkg, gotVer)
}

func (mgr *PackageManager) requestPackageByImportPath(ctx context.Context, importPath string, out dependenciesJar) error {
	wlog.Printf("resolving import %q...", importPath)
	pkgInfo, err := mgr.findPackageByImport(ctx, importPath)
	if err != nil {
		return err
	}

	return mgr.requestModule(ctx, pkgInfo, out)
}

func (mgr *PackageManager) requestModule(ctx context.Context, pkgInfo *module.Version, out dependenciesJar) error {
	wlog.Printf("Finding module %s...", pkgInfo)
	deps, err := mgr.getModuleDependencies(ctx, pkgInfo, out)
	if err != nil {
		return err
	}

	wlog.Printf("Module %s has %d dependencies", pkgInfo, len(deps))
	for _, dep := range deps {
		out.compareAndStore(dep)
	}

	out.compareAndStore(pkgInfo)
	return nil
}

func (mgr *PackageManager) downloadModule(ctx context.Context, pkgInfo *module.Version) error {
	r, err := mgr.goModProxy.GetModuleSource(ctx, pkgInfo.Path, pkgInfo.Version)
	if err != nil {
		return err
	}

	defer r.Close()

	wlog.Debugf("Downloading %s...", pkgInfo)

	buff := buffPool.Get()
	buff.Grow(int(r.Size))
	defer buff.Close()

	callbackReader := newProgressReader(r.Size, func(p Progress) {
		mgr.progressReporter.PackageDownload(pkgInfo, p)
	})

	if _, err := io.Copy(buff, io.TeeReader(r, callbackReader)); err != nil {
		return fmt.Errorf("failed to download module %s: %w", pkgInfo, err)
	}

	zr, err := zip.NewReader(bytes.NewReader(buff.Bytes()), r.Size)
	if err != nil {
		return fmt.Errorf("failed to open module archive %s: %w", pkgInfo, err)
	}

	for i, file := range zr.File {
		// TODO: ignore non-go files
		if shouldSkipFile(file.Name) {
			wlog.Debugf("File %s is ignored, skip", file.Name)
			continue
		}

		wlog.Debugf("Extracting %s...", file.Name)
		mgr.progressReporter.PackageExtract(pkgInfo, Progress{
			Total:   len(zr.File),
			Current: i + 1,
		})

		if err := mgr.pkgCache.WritePackageFile(pkgInfo, file.Name, newZipFSFile(file)); err != nil {
			// clean corrupted installation
			wlog.Debugf("Failed to write file %q, removing package %q (err: %s)",
				file.Name, pkgInfo, err)
			_ = mgr.pkgCache.RemovePackage(pkgInfo)
			return err
		}
	}

	if err := mgr.pkgCache.RegisterPackage(pkgInfo); err != nil {
		return fmt.Errorf("failed to register package %s: %w", pkgInfo, err)
	}

	return nil
}

func (mgr *PackageManager) getModuleDependencies(ctx context.Context, mod *module.Version, out dependenciesJar) ([]*module.Version, error) {
	// Module proxy still returns empty go.mod even if package doesn't have it.
	modFileContents, err := mgr.goModProxy.GetModuleFile(ctx, mod.Path, mod.Version)
	if err != nil {
		return nil, err
	}

	modFile, err := modfile.ParseLax("go.mod", modFileContents, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to parse go.mod file of package %s: %w", mod, err)
	}

	// TODO: handle old packages without "go.mod"
	if len(modFile.Require) == 0 {
		if modFile.Go == nil {
			wlog.Printf("Warning: package %s doesn't have go.mod dependencies, pre-go.mod packages are not supported yet!", mod)
		}

		return nil, nil
	}

	// TODO: handle replaces
	return lo.Map(modFile.Require, func(item *modfile.Require, _ int) *module.Version {
		return &module.Version{
			Path:    item.Mod.Path,
			Version: item.Mod.Version,
		}
	}), nil
}

func (mgr *PackageManager) findPackageByImport(ctx context.Context, pkgUrl string) (*module.Version, error) {
	// Try to guess package import path
	importPath, ok := guessPackageNameFromImport(pkgUrl)
	if ok {
		wlog.Printf("Detected package %q from import path, trying to request...", importPath)
		verInfo, err := mgr.goModProxy.GetLatestVersion(ctx, importPath)
		if err != nil {
			return nil, err
		}

		return &module.Version{
			Path:    importPath,
			Version: verInfo.Version,
		}, nil
	}

	// Otherwise - try to locate the longest valid queryable package name
	// in the same manner as "go get" does.
	segments := strings.Split(pkgUrl, "/")
	var (
		verInfo *goproxy.VersionInfo
		err     error
	)
	for i := len(segments) - 1; i > 0; i-- {
		pkgUrl := strings.Join(segments[:i+1], "/")
		wlog.Printf("Trying to find %q...", pkgUrl)
		verInfo, err = mgr.goModProxy.GetLatestVersion(ctx, pkgUrl)
		if err == nil {
			return &module.Version{
				Path:    pkgUrl,
				Version: verInfo.Version,
			}, nil
		}
	}

	return nil, err
}

func isSelfModulePackage(goModulePath, importUrl string) bool {
	if goModulePath == "" {
		return false
	}

	return strings.HasPrefix(importUrl, goModulePath)
}

// guessPackageNameFromImport tries to detect package URL from import path
// by checking if it's first section match popular hostnames like GitHub, Gitlab, etc.
//
// Used to speed-up package name lookup and reduce proxy.golang.org calls count.
//
// Returns package URL to request in case of success.
func guessPackageNameFromImport(importPath string) (string, bool) {
	segments := strings.Split(importPath, "/")
	if len(segments) < 2 {
		return importPath, false
	}

	switch segments[0] {
	case "github.com", "gitlab.com":
		// All GitHub and most of a public Gitlab repo packages
		// contain username and project name + optional "v" version suffix.
		//
		// ^gitlab.com/username/package(/v[\d])?$
		if len(segments) < 3 {
			// Invalid path, skip
			return "", false
		}

		if len(segments) < 4 {
			// Import path is already correct, skip
			return importPath, true
		}

		cutCount := 3
		if versionBranchRegEx.MatchString(segments[3]) {
			// Some packages put tag in package import path.
			cutCount = 4
		}

		return strings.Join(segments[:cutCount], "/"), true
	case "gopkg.in":
		// gopkg.in imports might be in 2 forms:
		//  - gopkg.in/foo.v1
		//  - gopkg.in/foo/bar.v1

		if len(segments) == 2 {
			return importPath, goPkgInPackage.MatchString(segments[1])
		}

		// Check short import
		if goPkgInPackage.MatchString(segments[1]) {
			return strings.Join(segments[:2], "/"), true
		}

		if goPkgInPackage.MatchString(segments[2]) {
			return strings.Join(segments[:3], "/"), true
		}

		return importPath, false
	case "golang.org":
		if segments[1] != "x" {
			return importPath, false
		}

		// Most experimental packages are not nested
		// See: https://pkg.go.dev/golang.org/x/exp
		return strings.Join(segments[:3], "/"), true

	case "google.golang.org":
		return strings.Join(segments[:2], "/"), true
	}

	return importPath, false
}

func isPackageOutdated(newPkg, oldPkg *module.Version) bool {
	result := semver.Compare(newPkg.Version, oldPkg.Version)
	return result != -1
}
