package main

import (
	"fmt"

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
		Use:   "[-r goroot] [-o output]",
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
	cmd.PersistentFlags().StringP("output", "o", "output.json", "Path to output file.")

	cmd.Execute()
}

func runErr(flags Flags) error {
	fmt.Println("GOROOT is ", flags.goRoot)
	return nil
}
