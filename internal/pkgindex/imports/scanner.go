// Package imports implements functionality for generating Monaco code completion data
// from documentation and symbols extracted from Go source files.
package imports

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/x1unix/go-playground/pkg/monaco"
)

const (
	queueInitSize = 300

	// resultsInitSize value based on a number of packages in Go 1.22
	resultsInitSize = 180
)

var buildContraintRegex = regexp.MustCompile(`(?m)^([\S]+)_(freebsd|darwin|plan9|windows|netbsd|arm|386|loong64|mips|ppc|riscv|s390x)`)

type scanResult struct {
	hasPkg   bool
	item     monaco.CompletionItem
	children []string
}

// GoRootScanner scans Go SDK directory and provides information about Go version and standard packages list.
type GoRootScanner struct {
	goRoot string
}

func NewGoRootScanner(goRoot string) GoRootScanner {
	return GoRootScanner{
		goRoot: goRoot,
	}
}

func (s *GoRootScanner) Scan() (*GoRootSummary, error) {
	version, err := CheckVersionFile(s.goRoot)
	if err != nil {
		return nil, fmt.Errorf("can't extract Go SDK version: %w", err)
	}

	entries, err := s.start()
	if err != nil {
		return nil, err
	}

	return &GoRootSummary{
		Version:  version,
		Packages: entries,
	}, nil
}

func (s *GoRootScanner) start() ([]monaco.CompletionItem, error) {
	rootDir := filepath.Join(s.goRoot, "src")
	entries, err := os.ReadDir(rootDir)
	if err != nil {
		return nil, fmt.Errorf("cannot open Go SDK directory: %w", err)
	}

	q := NewQueue[string](queueInitSize)
	for _, entry := range entries {
		if !entry.Type().IsDir() {
			continue
		}

		pkgName := entry.Name()
		if IsDirIgnored(pkgName, true) {
			continue
		}

		q.Add(pkgName)
	}

	results := make([]monaco.CompletionItem, 0, resultsInitSize)
	for q.Occupied() {
		pkgName, ok := q.Pop()
		if !ok {
			break
		}

		result, err := s.visitPackage(rootDir, pkgName)
		if err != nil {
			return nil, err
		}

		q.Add(result.children...)
		if result.hasPkg {
			results = append(results, result.item)
		}
	}

	return results, nil
}

func (s *GoRootScanner) visitPackage(rootDir string, importPath string) (scanResult, error) {
	entries, err := os.ReadDir(filepath.Join(rootDir, importPath))
	if err != nil {
		return scanResult{}, fmt.Errorf("failed to open package directory %q: %w", importPath, err)
	}

	var nextPkgs []string
	sourceFiles := make([]string, 0, len(entries))
	for _, entry := range entries {
		name := entry.Name()
		if shouldIgnoreFileName(name) {
			continue
		}

		if entry.IsDir() {
			pkgPath := path.Join(importPath, name)
			nextPkgs = append(nextPkgs, pkgPath)
			continue
		}

		if strings.HasSuffix(name, ".go") {
			sourceFiles = append(sourceFiles, name)
		}
	}

	if len(sourceFiles) == 0 {
		return scanResult{children: nextPkgs}, nil
	}

	item, err := ParseImportCompletionItem(context.Background(), PackageParseParams{
		RootDir:    rootDir,
		ImportPath: importPath,
		Files:      sourceFiles,
	})
	if err != nil {
		return scanResult{}, fmt.Errorf("failed to parse package %q: %w", importPath, err)
	}

	return scanResult{
		hasPkg:   true,
		item:     item,
		children: nextPkgs,
	}, nil
}

func CheckVersionFile(root string) (string, error) {
	f, err := os.Open(filepath.Join(root, "VERSION"))
	if err != nil {
		return "", fmt.Errorf("cannot open version file: %w", err)
	}

	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "go") {
			return strings.TrimSpace(strings.TrimPrefix(line, "go")), nil
		}
	}

	if err := scanner.Err(); err != nil {
		return "", err
	}

	return "", errors.New("can't find Go version in version file")
}

func shouldIgnoreFileName(fname string) bool {
	switch fname {
	case "internal", "testdata":
		return true
	}

	if isBuildConstraintFile(fname) {
		return true
	}

	return strings.HasSuffix(fname, "_test.go")
}

// isBuildConstraintFile checks whether file name contains Go build constraint.
//
// Linux and "_unix.go" files are allowed to align with GoDoc behavior.
// Wasm-target files are intentionally allowed to support `syscall/js` package.
//
// For example: `foo_amd64.go` or `bar_openbsd_ppc64.go`.
func isBuildConstraintFile(fname string) bool {
	return buildContraintRegex.MatchString(fname)
}
