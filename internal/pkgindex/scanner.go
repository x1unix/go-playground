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
	"golang.org/x/sync/errgroup"
)

const (
	// How many goroutines to use for parallel index.
	poolSize = 4

	// Size of a buffered channel to consume results.
	buffSize = 8

	// 1080 is a number of sub-directories in $GOROOT/src for Go 1.22.
	resultsPreallocSize = 1080
)

type scanResult struct {
	pkg   string
	entry monaco.CompletionItem
}

// GoRootScanner scans Go SDK directory and provides information about Go version and standard packages list.
type GoRootScanner struct {
	goRoot  string
	results chan scanResult
	wg      *errgroup.Group
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

	wg, childCtx := errgroup.WithContext(context.Background())
	wg.SetLimit(poolSize)
	s.wg = wg

	s.results = make(chan scanResult, buffSize)
	for _, entry := range entries {
		if !entry.Type().IsDir() {
			continue
		}

		pkgName := entry.Name()
		switch pkgName {
		case "cmd", "internal", "vendor", "builtin":
			continue
		}

		go s.wg.Go(func() error {
			return s.visitPackage(childCtx, rootDir, pkgName)
		})
	}

	// Extra goroutine to get finish result as error
	finishChan := make(chan error, 1)
	defer close(finishChan)
	go func() {
		finishChan <- wg.Wait()
	}()

	// Collect all results
	results := make([]monaco.CompletionItem, 0, resultsPreallocSize)
	for {
		select {
		case val := <-s.results:
			results = append(results, val.entry)
		case err := <-finishChan:
			return results, err
		}
	}
}

func (s *GoRootScanner) visitPackage(ctx context.Context, rootDir string, importPath string) error {
	if ctx.Err() != nil {
		return nil
	}

	entries, err := os.ReadDir(filepath.Join(rootDir, importPath))
	if err != nil {
		return fmt.Errorf("failed to open package directory %q: %w", importPath, err)
	}

	sourceFiles := make([]string, 0, len(entries))
	for _, entry := range entries {
		if ctx.Err() != nil {
			return nil
		}

		name := entry.Name()
		if shouldIgnoreFileName(name) {
			continue
		}

		if entry.IsDir() {
			go s.wg.Go(func() error {
				pkgPath := path.Join(importPath, name)
				return s.visitPackage(ctx, rootDir, pkgPath)
			})
			continue
		}

		if strings.HasSuffix(name, ".go") {
			sourceFiles = append(sourceFiles, name)
		}
	}

	if len(sourceFiles) == 0 {
		return nil
	}

	item, err := ParseImportCompletionItem(ctx, PackageParseParams{
		RootDir:    rootDir,
		ImportPath: importPath,
		Files:      sourceFiles,
	})
	if err != nil {
		return fmt.Errorf("failed to parse package %q: %w", importPath, err)
	}

	s.results <- scanResult{pkg: importPath, entry: item}
	return nil
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
