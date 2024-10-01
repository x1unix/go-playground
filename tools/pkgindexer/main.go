package main

import (
	"encoding/json"
	"fmt"
	"github.com/x1unix/go-playground/internal/pkgindex/index"
	"io"
	"log"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/x1unix/go-playground/internal/pkgindex/imports"
)

type Flags struct {
	goRoot      string
	outFile     string
	prettyPrint bool
	stdout      bool
}

func (f Flags) Validate() error {
	if f.outFile == "" && !f.stdout {
		return fmt.Errorf("missing output file flag. Use --stdout flag to print into stdout")
	}

	if f.stdout && f.outFile != "" {
		return fmt.Errorf("ambiguous output flag: --stdout and output file flag can't be together")
	}

	return nil
}

func (f Flags) WithDefaults() (Flags, error) {
	if err := f.Validate(); err != nil {
		return f, err
	}

	if f.goRoot != "" {
		return f, nil
	}

	goRoot, err := imports.ResolveGoRoot()
	if err != nil {
		return f, fmt.Errorf(
			"cannot find GOROOT, please set GOROOT path or check if Go is installed.\nError: %w",
			err,
		)
	}
	f.goRoot = goRoot
	return f, err
}

func main() {
	var flags Flags
	cmd := &cobra.Command{
		SilenceUsage: true,
		Use:          "pkgindexer <mode> [-r goroot] [-o output]",
		Short:        "Go standard library packages scanner",
		Long:         "Tool to generate Go package autocomplete entries for Monaco editor from Go SDK",
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "imports [-r goroot] [-o output]",
		Short: "Generate imports.json file for old Playground version",
		Long:  "Generate imports file which contains list of all importable packages. Used in legacy app versions",
		RunE: func(_ *cobra.Command, _ []string) error {
			resolvedFlags, err := flags.WithDefaults()
			if err != nil {
				return err
			}

			return runGenImports(resolvedFlags)
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "index [-r goroot] [-o output]",
		Short: "Generate index file with standard Go packages and symbols",
		Long:  "Generate a JSON file that contains list of all standard Go packages and its symbols. Used in new version of app",
		RunE: func(_ *cobra.Command, _ []string) error {
			resolvedFlags, err := flags.WithDefaults()
			if err != nil {
				return err
			}

			return runGenIndex(resolvedFlags)
		},
	})

	cmd.PersistentFlags().StringVarP(&flags.goRoot, "root", "r", "", "Path to GOROOT. Uses $GOROOT by default")
	cmd.PersistentFlags().StringVarP(&flags.outFile, "output", "o", "", "Path to output file. When enpty, prints to stdout")
	cmd.PersistentFlags().BoolVarP(&flags.prettyPrint, "pretty", "P", false, "Add indents to JSON output")
	cmd.PersistentFlags().BoolVar(&flags.stdout, "stdout", false, "Dump result into stdout")

	if err := cmd.Execute(); err != nil {
		os.Exit(2)
	}
}

func runGenIndex(flags Flags) error {
	entries, err := index.ScanRoot(flags.goRoot)
	if err != nil {
		return err
	}

	if err := writeOutput(flags, entries); err != nil {
		return err
	}

	log.Printf("Scanned %d packages and %d symbols", len(entries.Packages), len(entries.Symbols))
	return nil
}

func runGenImports(flags Flags) error {
	scanner := imports.NewGoRootScanner(flags.goRoot)
	results, err := scanner.Scan()
	if err != nil {
		return err
	}

	if err := writeOutput(flags, results); err != nil {
		return err
	}

	log.Printf("Scanned %d packages", len(results.Packages))
	return nil
}

func getEncoder(dst io.Writer, pretty bool) *json.Encoder {
	enc := json.NewEncoder(dst)
	if pretty {
		enc.SetIndent("", "  ")
	}

	return enc
}

func writeOutput(flags Flags, data any) error {
	if flags.outFile == "" {
		return getEncoder(os.Stdout, true).Encode(data)
	}

	if err := os.MkdirAll(filepath.Dir(flags.outFile), 0755); err != nil {
		return fmt.Errorf("failed to pre-create parent directories: %w", err)
	}

	f, err := os.OpenFile(flags.outFile, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0644)
	defer silentClose(f)

	if err != nil {
		return fmt.Errorf("can't create output file: %w", err)
	}

	if err := getEncoder(f, flags.prettyPrint).Encode(data); err != nil {
		return fmt.Errorf("can't write JSON to file %q: %w", flags.outFile, err)
	}

	return nil
}

func silentClose(c io.Closer) {
	// I don't care
	_ = c.Close()
}
