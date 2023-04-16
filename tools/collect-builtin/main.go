package main

import (
	_ "embed"
	"flag"
	"fmt"
	"log"
	"os"
	"path"
	"path/filepath"
	"text/template"
	"time"
)

//go:embed template.gohtml
var tplData []byte

type tplContext struct {
	PackageName string
	Packages    []string
	CreatedAt   time.Time
	GoVersion   string
}

type programOps struct {
	outFile string
	pkgName string
}

func main() {
	goroot, ok := os.LookupEnv("GOROOT")
	if !ok {
		log.Fatal("GOROOT is not defined")
	}

	var opts programOps
	flag.StringVar(&opts.outFile, "out", "builtin.go", "Output Go file")
	flag.StringVar(&opts.pkgName, "pkg", "", "Package name")
	flag.Parse()

	if opts.pkgName == "" {
		absPath, err := filepath.Abs(opts.outFile)
		if err != nil {
			log.Fatal(err)
		}

		opts.pkgName = filepath.Base(filepath.Dir(absPath))
	}

	result, err := traverseSubdirs(filepath.Join(goroot, "src"), "")
	if err != nil {
		log.Fatal(err)
	}

	tpl, err := template.New(opts.outFile).Parse(string(tplData))
	if err != nil {
		log.Fatal(err)
	}

	f, err := os.OpenFile(opts.outFile, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal(err)
	}

	goVer, err := os.ReadFile(filepath.Join(goroot, "VERSION"))
	if err != nil {
		log.Printf("Warning: failed to find VERSION file: %s", err)
	}

	tplCtx := tplContext{
		PackageName: opts.pkgName,
		Packages:    result,
		CreatedAt:   time.Now(),
		GoVersion:   string(goVer),
	}
	defer f.Close()
	if err := tpl.Execute(f, tplCtx); err != nil {
		log.Fatal(err)
	}

}

func traverseSubdirs(goRoot, dirName string) ([]string, error) {
	dirPath := filepath.Join(goRoot, dirName)
	log.Printf("Traverse %q", dirPath)
	items, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, fmt.Errorf("can't traverse %q: %w", dirPath, err)
	}

	results := make([]string, 0, len(items)*2)
	for _, item := range items {
		if !item.IsDir() {
			continue
		}

		switch item.Name() {
		case "internal", "testdata", "vendor":
			continue
		}

		childDir := path.Join(dirName, item.Name())
		results = append(results, childDir)
		subItems, err := traverseSubdirs(goRoot, childDir)
		if err != nil {
			return nil, err
		}

		results = append(results, subItems...)
	}

	return results, nil
}
