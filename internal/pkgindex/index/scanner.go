package index

import (
	"fmt"
	"go/token"
	"log"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/x1unix/go-playground/internal/pkgindex/docutil"
	"github.com/x1unix/go-playground/internal/pkgindex/imports"
)

// queueSize is based on max occupation of a queue during test scan of Go 1.23.
//
// See: Queue.MaxOccupancy
const queueSize = 120

type scanEntry struct {
	isVendor   bool
	path       string
	importPath string
}

func (ent scanEntry) makeChild(dirName string) scanEntry {
	return scanEntry{
		path:       filepath.Join(ent.path, dirName),
		importPath: path.Join(ent.importPath, dirName),
	}
}

func ScanRoot(goRoot string) (*GoIndexFile, error) {
	goVersion, err := imports.CheckVersionFile(goRoot)
	if err != nil {
		log.Printf("Warning: can't read version file, using fallback. Error: %s", err)
		goVersion = strings.TrimPrefix(runtime.Version(), "go")
	}

	// populate queue with root packages
	rootDir := filepath.Join(goRoot, "src")
	queue := imports.NewQueue[scanEntry](queueSize)
	if err := enqueueRootEntries(rootDir, "", queue); err != nil {
		return nil, err
	}

	// There are 213 packages in Go 1.23
	packages := make([]PackageInfo, 0, 213)
	symbols := make([]SymbolInfo, 0, 300)

	for queue.Occupied() {
		v, ok := queue.Pop()
		if !ok {
			break
		}

		// Edge case: Apparently GOROOT has vendoring for its own packages.
		if v.isVendor {
			if err := enqueueRootEntries(v.path, "", queue); err != nil {
				return nil, err
			}

			continue
		}

		result, err := traverseScanEntry(v, queue)
		if err != nil {
			return nil, fmt.Errorf("error while scanning package %q: %w", v.importPath, err)
		}

		if result == nil {
			continue
		}

		// Edge case: "builtin" package exists only for documentation purposes
		// and not importable.
		// Also skip empty packages (usually part of vendor path).
		if result.pkgInfo.ImportPath != docutil.BuiltinPackage && len(result.symbols) != 0 {
			packages = append(packages, result.pkgInfo)
		}

		symbols = append(symbols, result.symbols...)
	}

	return &GoIndexFile{
		Version:  GoIndexFileVersion,
		Go:       goVersion,
		Packages: packages,
		Symbols:  symbols,
	}, nil
}

type traverseResult struct {
	pkgInfo PackageInfo
	symbols []SymbolInfo
}

func traverseScanEntry(entry scanEntry, queue *imports.Queue[scanEntry]) (*traverseResult, error) {
	var (
		pkgInfo PackageInfo
		symbols []SymbolInfo
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
			if strings.HasSuffix(name, "_test.go") || !strings.HasSuffix(name, ".go") {
				continue
			}

			f, err := parseFile(fset, absPath, fileParseParams{
				parseDoc:   pkgInfo.Documentation != "",
				importPath: entry.importPath,
			})
			if err != nil {
				return nil, fmt.Errorf("can't parse file %q: %w", absPath, err)
			}

			symbols = append(symbols, f.symbols...)
			pkgInfo.Name = f.packageName
			if f.doc != nil {
				pkgInfo.Documentation = docutil.BuildPackageDoc(f.doc, entry.importPath)
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

		queue.Add(scanEntry{
			path:       absPath,
			importPath: path.Join(),
		})
	}

	return &traverseResult{
		pkgInfo: pkgInfo,
		symbols: symbols,
	}, nil
}

func enqueueRootEntries(rootDir string, parentImportPath string, queue *imports.Queue[scanEntry]) error {
	entries, err := os.ReadDir(rootDir)
	if err != nil {
		return fmt.Errorf("can't read dir %q: %w", rootDir, err)
	}

	for _, entry := range entries {
		if !entry.IsDir() || isDirIgnored(entry.Name()) {
			continue
		}

		absPath := filepath.Join(rootDir, entry.Name())
		if imports.IsVendorDir(entry.Name()) {
			queue.Add(scanEntry{
				isVendor: true,
				path:     absPath,
			})
			continue
		}

		importPath := entry.Name()
		if parentImportPath != "" {
			importPath = path.Join(parentImportPath, importPath)
		}
		queue.Add(scanEntry{
			path:       absPath,
			importPath: entry.Name(),
		})
	}

	return nil
}

func isDirIgnored(basename string) bool {
	switch basename {
	case "cmd", "internal", "testdata":
		return true
	}

	return false
}
