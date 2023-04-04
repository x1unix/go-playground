package gorepl

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"go/parser"
	"go/token"
	"io"
	"log"
	"regexp"
	"strconv"
	"strings"

	"github.com/samber/lo"
	"github.com/x1unix/go-playground/internal/util/syncx"
	"github.com/x1unix/go-playground/pkg/goproxy"
	"golang.org/x/mod/modfile"
)

var (
	versionBranchRegEx = regexp.MustCompile(`^v\d(.\d+)?(.\d+)?$`)
	goPkgInPackage     = regexp.MustCompile(`^[\w\d]+\.v\d(.\d+)?(.\d+)?$`)
)

type FileWriter interface {
	RemoveAll(name string) error
	WriteFile(name string, data io.Reader) error
}

type packageInfo struct {
	packageName string
	version     string
}

func (pkg packageInfo) String() string {
	return pkg.packageName + "@" + pkg.version
}

type PackageManager struct {
	goModProxy  *goproxy.Client
	cachedPaths syncx.Set[string]
	fileStore   FileWriter
}

func NewPackageManager(modProxy *goproxy.Client, fs FileWriter) *PackageManager {
	return &PackageManager{
		fileStore:   fs,
		goModProxy:  modProxy,
		cachedPaths: syncx.NewSet[string](),
	}
}

func (mgr *PackageManager) CheckDependencies(ctx context.Context, importPaths []string) error {
	newProjectPackages := lo.Filter(importPaths, func(item string, _ int) bool {
		return !mgr.cachedPaths.Has(item)
	})
	if len(newProjectPackages) == 0 {
		return nil
	}

	fmt.Println(newProjectPackages)
	for _, pkg := range newProjectPackages {
		if err := mgr.requestPackageByImportPath(ctx, pkg); err != nil {
			return err
		}
	}

	return nil
}

func parseFileImports(filename, moduleUrl string, code []byte) ([]string, error) {
	fset := token.NewFileSet()
	p, err := parser.ParseFile(fset, filename, code, parser.ImportsOnly)
	if err != nil {
		return nil, err
	}

	if len(p.Imports) == 0 {
		return nil, nil
	}

	imports := make([]string, 0, len(p.Imports))
	for _, importDecl := range p.Imports {
		importPath, err := strconv.Unquote(importDecl.Path.Value)
		if err != nil {
			importPath = importDecl.Path.Value
		}

		if isStandardGoPackage(importPath) {
			continue
		}

		if isSelfModulePackage(moduleUrl, importPath) {
			continue
		}

		imports = append(imports, importPath)
	}

	return imports, nil
}

func (mgr *PackageManager) requestPackageByImportPath(ctx context.Context, importPath string) error {
	log.Printf("resolving import %q...", importPath)
	pkgInfo, err := mgr.findPackageByImport(ctx, importPath)
	if err != nil {
		return err
	}

	if mgr.cachedPaths.Has(pkgInfo.packageName) {
		log.Printf("%s already cached, skip", pkgInfo)
		return nil
	}

	return mgr.requestModule(ctx, pkgInfo)
}

func (mgr *PackageManager) requestModule(ctx context.Context, pkgInfo *packageInfo) error {
	log.Printf("Finding module %s...", pkgInfo)
	deps, err := mgr.getModuleDependencies(ctx, pkgInfo.packageName, pkgInfo.version)
	if err != nil {
		return err
	}

	log.Printf("Module %s has %d dependencies", pkgInfo, len(deps))
	for _, dep := range deps {
		if mgr.cachedPaths.Has(dep.packageName) {
			log.Printf("%s already cached, skip", dep)
			continue
		}

		if err := mgr.requestModule(ctx, dep); err != nil {
			return err
		}
	}

	if mgr.cachedPaths.Has(pkgInfo.packageName) {
		log.Printf("%s already cached, skip", pkgInfo)
		return nil
	}

	if err := mgr.downloadModule(ctx, pkgInfo); err != nil {
		return fmt.Errorf("failed to download module %s@%s: %w",
			pkgInfo.packageName, pkgInfo.version, err)
	}

	mgr.cachedPaths.Add(pkgInfo.packageName)
	return nil
}

func (mgr *PackageManager) downloadModule(ctx context.Context, pkgInfo *packageInfo) error {
	r, err := mgr.goModProxy.GetModuleSource(ctx, pkgInfo.packageName, pkgInfo.version)
	if err != nil {
		return err
	}

	defer r.Close()

	log.Printf("Downloading %s...", pkgInfo)

	buff := bufferFromPoolWithSize(int(r.Size))
	defer buff.Close()

	if _, err := io.Copy(buff, r); err != nil {
		return fmt.Errorf("failed to download module %s: %w", pkgInfo, err)
	}

	zr, err := zip.NewReader(bytes.NewReader(buff.Bytes()), r.Size)
	if err != nil {
		return fmt.Errorf("failed to open module archive %s: %w", pkgInfo, err)
	}

	for _, file := range zr.File {
		// TODO: ignore non-go files
		log.Printf("Extracting %s...", file.Name)

		// TODO: remove module dir on error
		fileReader, err := file.Open()
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", file.Name, err)
		}

		if err := mgr.fileStore.WriteFile(file.Name, fileReader); err != nil {
			_ = fileReader.Close()
			return fmt.Errorf("failed to save file %s: %w", file.Name, err)
		}
		_ = fileReader.Close()
	}

	return nil
}

func (mgr *PackageManager) getModuleDependencies(ctx context.Context, pkg, version string) ([]*packageInfo, error) {
	// Module proxy still returns empty go.mod even if package doesn't have it.
	modFileContents, err := mgr.goModProxy.GetModuleFile(ctx, pkg, version)
	if err != nil {
		return nil, err
	}

	mod, err := modfile.ParseLax("go.mod", modFileContents, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to parse go.mod file of package %s@%s: %w", pkg, version, err)
	}

	// TODO: handle old packages without "go.mod"
	if len(mod.Require) == 0 {
		if mod.Go == nil {
			log.Printf("Warning: package %s@%s doesn't have go.mod dependencies, pre-go.mod packages are not supported yet!",
				pkg, version)
		}

		return nil, nil
	}

	// TODO: handle replaces
	return lo.Map(mod.Require, func(item *modfile.Require, _ int) *packageInfo {
		return &packageInfo{
			packageName: item.Mod.Path,
			version:     item.Mod.Version,
		}
	}), nil
}

func (mgr *PackageManager) findPackageByImport(ctx context.Context, pkgUrl string) (*packageInfo, error) {
	// Try to guess package import path
	importPath, ok := guessPackageNameFromImport(pkgUrl)
	if ok {
		fmt.Printf("Detected package %q from import path, trying to request...\n", importPath)
		verInfo, err := mgr.goModProxy.GetLatestVersion(ctx, importPath)
		if err != nil {
			return nil, err
		}

		return &packageInfo{
			packageName: importPath,
			version:     verInfo.Version,
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
		log.Printf("Trying to find %q...", pkgUrl)
		verInfo, err = mgr.goModProxy.GetLatestVersion(ctx, pkgUrl)
		if err == nil {
			return &packageInfo{
				packageName: pkgUrl,
				version:     verInfo.Version,
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
		// All Github and most of a public Gitlab repo packages
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
