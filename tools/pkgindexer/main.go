package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/x1unix/go-playground/internal/pkgindex"
)

type Flags struct {
	goRoot      string
	outFile     string
	prettyPrint bool
}

func (f Flags) WithDefaults() (Flags, error) {
	if f.goRoot != "" {
		return f, nil
	}

	goRoot, err := pkgindex.ResolveGoRoot()
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
		Use:          "pkgindexer [-r goroot] [-o output]",
		Short:        "Go standard library packages scanner",
		Long:         "Tool to generate Go package autocomplete entries for Monaco editor from Go SDK",
		RunE: func(cmd *cobra.Command, args []string) error {
			resolvedFlags, err := flags.WithDefaults()
			if err != nil {
				return err
			}

			return runErr(resolvedFlags)
		},
	}

	cmd.PersistentFlags().StringVarP(&flags.goRoot, "root", "r", "", "Path to GOROOT. Uses $GOROOT by default.")
	cmd.PersistentFlags().StringVarP(&flags.outFile, "output", "o", "", "Path to output file. When enpty, prints to stdout.")
	cmd.PersistentFlags().BoolVarP(&flags.prettyPrint, "pretty", "P", false, "Add indents to JSON output")

	if err := cmd.Execute(); err != nil {
		os.Exit(2)
	}
}

func runErr(flags Flags) error {
	scanner := pkgindex.NewGoRootScanner(flags.goRoot)
	results, err := scanner.Scan()
	if err != nil {
		return err
	}

	if flags.outFile == "" {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return getEncoder(os.Stdout, flags.prettyPrint).Encode(results)
	}

	if err := os.MkdirAll(filepath.Dir(flags.outFile), 0755); err != nil {
		return fmt.Errorf("failed to pre-create parent directories: %w", err)
	}

	f, err := os.OpenFile(flags.outFile, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0644)
	defer silentClose(f)

	if err != nil {
		return fmt.Errorf("can't create output file: %w", err)
	}

	if err := getEncoder(f, flags.prettyPrint).Encode(results); err != nil {
		return fmt.Errorf("can't write JSON to file %q: %w", flags.outFile, err)
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

func silentClose(c io.Closer) {
	// I don't care
	_ = c.Close()
}
