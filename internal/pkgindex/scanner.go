// Package pkgindex implements functionality for generating Monaco code completion data
// from documentation and symbols extracted from Go source files.
package pkgindex

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/x1unix/go-playground/pkg/monaco"
)

const (
	// 1080 is a number of sub-directories in $GOROOT/src for Go 1.22.
	resultsPreallocSize = 1080
)

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
	version, err := checkVersion(s.goRoot)
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

	q := newQueue(resultsPreallocSize)
	for _, entry := range entries {
		if !entry.Type().IsDir() {
			continue
		}

		pkgName := entry.Name()
		switch pkgName {
		case "cmd", "internal", "vendor", "builtin":
			continue
		}

		q.add(pkgName)
		// go s.wg.Go(func() error {
		// 	return s.visitPackage(childCtx, rootDir, pkgName)
		// })
	}

	results := make([]monaco.CompletionItem, 0, resultsPreallocSize)
	for q.occupied() {
		pkgName, ok := q.pop()
		if !ok {
			break
		}

		item, nextPkgs, err := s.visitPackage(rootDir, pkgName)
		if err != nil {
			return nil, err
		}

		q.add(nextPkgs...)
		results = append(results, item)
	}

	return results, nil
}

func (s *GoRootScanner) visitPackage(rootDir string, importPath string) (monaco.CompletionItem, []string, error) {
	entries, err := os.ReadDir(filepath.Join(rootDir, importPath))
	if err != nil {
		return monaco.CompletionItem{}, nil, fmt.Errorf("failed to open package directory %q: %w", importPath, err)
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
		return monaco.CompletionItem{}, nextPkgs, nil
	}

	item, err := ParseImportCompletionItem(context.Background(), PackageParseParams{
		RootDir:    rootDir,
		ImportPath: importPath,
		Files:      sourceFiles,
	})
	if err != nil {
		return item, nil, fmt.Errorf("failed to parse package %q: %w", importPath, err)
	}

	return item, nextPkgs, nil
}

func checkVersion(root string) (string, error) {
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

	return strings.HasSuffix(fname, "_test.go")
}
