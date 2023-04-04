package gorepl

import (
	"context"
	"fmt"
	"go/parser"
	"go/token"
	"regexp"
	"strconv"
	"strings"

	"github.com/samber/lo"
	"github.com/x1unix/go-playground/internal/util/syncx"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

var (
	versionBranchRegEx = regexp.MustCompile(`^v\d(.\d+)?(.\d+)?$`)
	goPkgInPackage     = regexp.MustCompile(`^[\w\d]+\.v\d(.\d+)?(.\d+)?$`)
)

type PackageManager struct {
	goModProxy  *goproxy.Client
	cachedPaths syncx.Set[string]
}

func NewPackageManager(modProxy *goproxy.Client) *PackageManager {
	return &PackageManager{
		goModProxy:  modProxy,
		cachedPaths: syncx.NewSet[string](),
	}
}

func (mgr *PackageManager) CheckDependencies(ctx context.Context, code []byte) error {
	rootImports, err := parseFileImports("main.go", "", code)
	if err != nil {
		return err
	}

	newProjectPackages := lo.Filter(rootImports, func(item string, _ int) bool {
		return !mgr.cachedPaths.Has(item)
	})
	if len(newProjectPackages) == 0 {
		return nil
	}

	fmt.Println(newProjectPackages)
	for _, pkg := range newProjectPackages {
		if err := mgr.requestPackage(ctx, pkg, ""); err != nil {
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

func (mgr *PackageManager) requestPackage(ctx context.Context, pkgUrl, version string) error {
	fmt.Printf("Downloading package %q...", pkgUrl)
	if version == "" {
		verInfo, err := mgr.goModProxy.GetLatestVersion(ctx, pkgUrl)
		if err != nil {
			return fmt.Errorf("failed to get latest version of package %q: %w", pkgUrl, err)
		}
		version = verInfo.Version
	}

	goMod, err := mgr.goModProxy.GetModuleFile(ctx, pkgUrl, version)
	if err != nil {
		return err
	}

	fmt.Println(goMod)
	return nil
}

func isSelfModulePackage(goModulePath, importUrl string) bool {
	if goModulePath == "" {
		return false
	}

	return strings.HasPrefix(importUrl, goModulePath)
}

// detectPackageNameFromImport tries to detect package URL from import path
// by checking if it's first section match popular hostnames like GitHub, Gitlab, etc.
//
// Returns package URL to request in case of success.
func detectPackageNameFromImport(importPath string) (string, bool) {
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
