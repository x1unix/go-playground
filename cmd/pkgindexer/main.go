package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/x1unix/go-playground/internal/pkgindex"
)

type Flags struct {
	goRoot  string
	outFile string
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
		Use:   "pkgindexer [-r goroot] [-o output]",
		Short: "Go standard library packages scanner",
		Long:  "Tool to generate Go package autocomplete entries for Monaco editor from Go SDK",
		RunE: func(cmd *cobra.Command, args []string) error {
			resolvedFlags, err := flags.WithDefaults()
			if err != nil {
				return err
			}

			return runErr(resolvedFlags)
		},
	}

	cmd.PersistentFlags().StringP("root", "r", "", "Path to GOROOT. Uses $GOROOT by default.")
	cmd.PersistentFlags().StringP("output", "o", "", "Path to output file. When enpty, prints to stdout.")

	cmd.Execute()
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
		return enc.Encode(results)
	}

	f, err := os.OpenFile(flags.outFile, os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return fmt.Errorf("can't create output file: %w", err)
	}

	if err := json.NewEncoder(f).Encode(results); err != nil {
		return fmt.Errorf("can't write JSON to file %q: %w", flags.outFile, err)
	}

	return nil
}
