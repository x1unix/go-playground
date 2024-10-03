package cmd

import (
	"log"

	"github.com/spf13/cobra"
	"github.com/x1unix/go-playground/internal/pkgindex/imports"
)

func newCmdImports(g *globalFlags) *cobra.Command {
	flags := importsFlags{
		globalFlags: g,
	}
	cmd := &cobra.Command{
		Use:   "imports [-r goroot] [-o output]",
		Short: "Generate imports.json file for old Playground version",
		Long:  "Generate imports file which contains list of all importable packages. Used in legacy app versions",
		PreRunE: func(_ *cobra.Command, _ []string) error {
			return flags.validate()
		},
		RunE: func(_ *cobra.Command, _ []string) error {
			return runGenImports(flags)
		},
	}

	cmd.Flags().StringVarP(&flags.outFile, "output", "o", "", "Path to output file. When enpty, prints to stdout")
	cmd.Flags().BoolVarP(&flags.prettyPrint, "pretty", "P", false, "Add indents to JSON output")
	cmd.Flags().BoolVar(&flags.stdout, "stdout", false, "Dump result into stdout")
	return cmd
}

func runGenImports(flags importsFlags) error {
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
