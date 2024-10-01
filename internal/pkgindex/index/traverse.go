package index

import (
	"fmt"
	"github.com/x1unix/go-playground/internal/pkgindex/docutil"
	"github.com/x1unix/go-playground/internal/pkgindex/imports"
	"go/token"
	"os"
	"path"
	"path/filepath"
)

type traverseResult struct {
	pkgInfo PackageInfo
	symbols []SymbolInfo
}

func traverseScanEntry(entry scanEntry, queue *imports.Queue[scanEntry]) (*traverseResult, error) {
	var (
		symbols []SymbolInfo
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
		absPath := filepath.Join(entry.path, name)

		if !dirent.IsDir() {
			if !docutil.IsGoSourceFile(name) {
				continue
			}

			f, err := parseFile(fset, absPath, fileParseParams{
				parseDoc:   pkgInfo.Doc == "",
				importPath: entry.importPath,
			})
			if err != nil {
				return nil, fmt.Errorf("can't parse file %q: %w", absPath, err)
			}

			symbols = append(symbols, f.symbols...)
			pkgInfo.Name = f.packageName
			if f.doc != nil {
				pkgInfo.Doc = docutil.BuildPackageDoc(f.doc, entry.importPath)
			}
			continue
		}

		if isDirIgnored(name) {
			continue
		}

		// TODO: should nested vendors be supported?
		if imports.IsVendorDir(name) {
			queue.Add(scanEntry{
				isVendor: true,
				path:     absPath,
			})
			continue
		}

		p := path.Join(entry.importPath, name)
		if !isImportPathIgnored(p) {
			queue.Add(scanEntry{
				path:       absPath,
				importPath: p,
			})
		}
	}

	if len(symbols) == 0 {
		return nil, nil
	}

	return &traverseResult{
		pkgInfo: pkgInfo,
		symbols: symbols,
	}, nil
}
