package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"go/doc"
	"go/parser"
	"go/token"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
)

var verbose bool

type Package struct {
	Name     string    `json:"name"`
	Synopsis string    `json:"synopsis"`
	URL      string    `json:"url"`
	Path     string    `json:"path"`
	Children []Package `json:"children"`
}

func main() {
	var (
		goRoot   string
		destFile string
		err      error
	)
	flag.StringVar(&goRoot, "goroot", "", "GOROOT path")
	flag.StringVar(&destFile, "out", "packages.json", "Output file name")
	flag.BoolVar(&verbose, "v", false, "Verbose output")
	flag.Parse()

	if goRoot == "" {
		log.Println("'-goroot' flag not provided, trying to find GOROOT automatically...")
		goRoot, err = goRootFromEnv()
		if err != nil {
			log.Fatalf("Failed to detect GOROOT, try to specify it with '-goroot' flag. Error: %s", err)
		}
		log.Printf("Detected GOROOT location: %s", goRoot)
	}

	if err := collectPackages(filepath.Join(goRoot, "src"), destFile); err != nil {
		log.Fatalln(err)
	}
}

func goRootFromEnv() (string, error) {
	if envVal := os.Getenv("GOROOT"); envVal != "" {
		log.Println("Found GOROOT environment variable")
		return envVal, nil
	}

	cmd := exec.Command("go", "env", "GOROOT")
	result, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("command 'go env GOROOT' returned an error: %w (%s)", err, string(result))
	}

	result = bytes.TrimSpace(result)
	if len(result) == 0 {
		return "", fmt.Errorf("command 'go env GOROOT' didn't return any result")
	}

	log.Println("Found GOROOT from 'go env GOROOT' command")
	return string(result), nil
}

func collectPackages(sdkDir, dstFile string) error {
	log.Printf("Looking for packages in Go SDK directory %s...", sdkDir)
	pkgs, err := analyzeDir(sdkDir, "")
	if err != nil {
		return err
	}

	log.Println("Saving data to", dstFile)
	file, err := os.OpenFile(dstFile, os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		return err
	}

	defer file.Close()
	enc := json.NewEncoder(file)
	enc.SetIndent("", "  ")
	if err := enc.Encode(pkgs); err != nil {
		return fmt.Errorf("failed to save data to file %s: %w", dstFile, err)
	}
	return nil
}

func analyzeDir(sdkDir, pathName string) ([]Package, error) {
	if isIgnoredPackageDir(path.Base(pathName)) {
		return nil, nil
	}

	files, err := ioutil.ReadDir(filepath.Join(sdkDir, pathName))
	if err != nil {
		return nil, fmt.Errorf("failed to open %q: %w", pathName, err)
	}

	pkgs := make([]Package, 0, len(files))
	for _, f := range files {
		if !f.IsDir() {
			continue
		}

		if isIgnoredPackageDir(f.Name()) {
			continue
		}

		dirPkgs, err := analyzePackage(sdkDir, path.Join(pathName, f.Name()))
		if err != nil {
			return nil, err
		}

		pkgs = append(pkgs, dirPkgs...)
	}

	return pkgs, nil
}

func analyzePackage(sdkDir, pathName string) ([]Package, error) {
	set := token.NewFileSet()
	packs, err := parser.ParseDir(set, filepath.Join(sdkDir, pathName), nil, parser.ParseComments)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze %q: %w", pathName, err)
	}

	// analyze nested packages if dir is empty
	if len(packs) == 0 {
		children, err := analyzeDir(sdkDir, pathName)
		if err != nil {
			return nil, err
		}

		if len(children) == 0 {
			return nil, nil
		}

		pkg := Package{
			Name:     path.Base(pathName),
			Path:     pathName,
			URL:      "https://pkg.go.dev/" + pathName,
			Children: children,
		}
		return []Package{pkg}, nil
	}

	pkgs := make([]Package, 0, len(packs))
	for _, pkg := range packs {
		if isIgnoredPackageDir(pkg.Name) {
			continue
		}

		if verbose {
			log.Println(pathName)
		}
		pkgDoc := doc.New(pkg, pathName, 0)
		description := pkgDoc.Doc

		// quirk for builtin package, which has tabbed padding for description.
		if pkg.Name == "builtin" || pkg.Name == "unsafe" {
			description = strings.Join(strings.Split(description, "\t"), "")
		}

		docStr := formatDocString(description)
		docStr += fmt.Sprintf("[\"%[1]s\" on pkg.go.dev](https://pkg.go.dev/%[1]s)", pathName)

		pkg := Package{
			Name:     pkg.Name,
			Synopsis: docStr,
			Path:     pathName,
			URL:      "https://pkg.go.dev/" + pathName,
		}

		pkg.Children, err = analyzeDir(sdkDir, pathName)
		if err != nil {
			return nil, fmt.Errorf("failed to analyze package %q: %w", pkg.Name, err)
		}

		pkgs = append(pkgs, pkg)
	}
	return pkgs, nil
}

func formatDocString(str string) string {
	sb := strings.Builder{}
	chunks := strings.Split(str, "\n")

	docStarted := false
	for _, chunk := range chunks {
		if strings.HasPrefix(chunk, "\t") {
			if !docStarted {
				sb.WriteString("```\n")
				docStarted = true
			}
			sb.WriteString(trimLeftPad(chunk))
			sb.WriteRune('\n')
			continue
		}

		trimmed := strings.TrimSpace(chunk)
		if len(trimmed) == 0 {
			sb.WriteString(chunk)
			sb.WriteRune('\n')
			continue
		}

		if docStarted {
			docStarted = false
			sb.WriteString("```\n")
		}
		sb.WriteString(chunk)
		sb.WriteRune('\n')
	}

	return sb.String()
}

func trimLeftPad(str string) string {
	if len(str) == 0 || str[0] != '\t' {
		return str
	}

	return str[1:]
}

func isIgnoredPackageDir(pkgName string) bool {
	switch pkgName {
	case "internal", "main", "vendor", "testdata":
		return true
	default:
		return strings.HasSuffix(pkgName, "_test")
	}
}
