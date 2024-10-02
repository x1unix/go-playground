package index

import (
	"fmt"
	"go/build"
	"go/token"
	"log"
	"os"
	"path"
	"path/filepath"

	"github.com/x1unix/go-playground/internal/pkgindex/docutil"
	"github.com/x1unix/go-playground/internal/pkgindex/imports"
)

// defaultCtx is build constraint context to select only files
// that match desired platform.
//
// To keep aligned with godoc - uses same GOOS and GOARCH.
var defaultCtx = build.Context{
	GOARCH: "amd64",
	GOOS:   "linux",
}

type traverseResult struct {
	pkgInfo      PackageInfo
	symbolsCount int
}

func isFileIgnored(entry scanEntry, fname string) (bool, error) {
	if !docutil.IsGoSourceFile(fname) {
		return true, nil
	}

	// provide docs for single-platform packages.
	switch entry.importPath {
	case "syscall/js":
		return false, nil
	}

	match, err := defaultCtx.MatchFile(entry.path, fname)
	if err != nil {
		return false, fmt.Errorf(
			"can't check build constraints for file %q: %w", filepath.Join(entry.path, fname), err,
		)
	}

	if !match && Debug {
		log.Printf("Skip file: %s/%s", entry.importPath, fname)
	}
	return !match, err
}

func traverseScanEntry(entry scanEntry, queue *imports.Queue[scanEntry], collector CollectFn) (*traverseResult, error) {
	var (
		count   int
		pkgInfo = PackageInfo{
			ImportPath: entry.importPath,
		}
	)

	dirents, err := os.ReadDir(entry.path)
	if err != nil {
		return nil, fmt.Errorf("can't read dir %q: %w", entry.path, err)
	}

	fset := token.NewFileSet()
	for _, dirent := range dirents {
		name := dirent.Name()
		if dirent.IsDir() {
			enqueueSubDir(queue, entry, name)
			continue
		}

		isIgnored, err := isFileIgnored(entry, name)
		if err != nil {
			return nil, err
		}

		if isIgnored {
			continue
		}

		absPath := filepath.Join(entry.path, name)
		f, err := parseFile(fset, absPath, fileParseParams{
			parseDoc:   pkgInfo.Doc == "",
			importPath: entry.importPath,
			collector:  collector,
		})
		if err != nil {
			return nil, fmt.Errorf("can't parse file %q: %w", absPath, err)
		}

		count += f.symbolsCount
		pkgInfo.Name = f.packageName
		if f.doc != nil {
			pkgInfo.Doc = docutil.BuildPackageDoc(f.doc, entry.importPath)
		}
	}

	if count == 0 {
		return nil, nil
	}

	return &traverseResult{
		pkgInfo:      pkgInfo,
		symbolsCount: count,
	}, nil
}

func enqueueSubDir(queue *imports.Queue[scanEntry], parent scanEntry, name string) {
	if isDirIgnored(name) {
		return
	}

	// TODO: should nested vendors be supported?
	absPath := filepath.Join(parent.path, name)
	if imports.IsVendorDir(name) {
		queue.Add(scanEntry{
			isVendor: true,
			path:     absPath,
		})
		return
	}

	importPath := path.Join(parent.importPath, name)
	if isImportPathIgnored(importPath) {
		return
	}

	queue.Add(scanEntry{
		path:       absPath,
		importPath: importPath,
	})
}
