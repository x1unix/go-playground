package cmd

import (
	"log"

	"github.com/spf13/cobra"
	"github.com/x1unix/go-playground/internal/pkgindex/index"
)

func newCmdIndex(g *globalFlags) *cobra.Command {
	flags := importsFlags{
		globalFlags: g,
	}

	cmd := &cobra.Command{
		Use:   "index [-r goroot] [-o output]",
		Short: "Generate index file with standard Go packages and symbols",
		Long:  "Generate a JSON file that contains list of all standard Go packages and its symbols. Used in new version of app",
		PreRunE: func(_ *cobra.Command, _ []string) error {
			index.Debug = flags.verbose
			return flags.validate()
		},
		RunE: func(_ *cobra.Command, _ []string) error {
			return runGenIndex(flags)
		},
	}

	cmd.Flags().StringVarP(&flags.outFile, "output", "o", "", "Path to output file. When enpty, prints to stdout")
	cmd.Flags().BoolVarP(&flags.prettyPrint, "pretty", "P", false, "Add indents to JSON output")
	cmd.Flags().BoolVar(&flags.stdout, "stdout", false, "Dump result into stdout")
	cmd.Flags().BoolVarP(&flags.verbose, "verbose", "v", false, "Enable verbose logging")
	return cmd
}

func runGenIndex(flags importsFlags) error {
	entries, err := index.ScanRoot(flags.goRoot)
	if err != nil {
		return err
	}

	if err := writeOutput(flags, entries); err != nil {
		return err
	}

	log.Printf("Scanned %d packages and %d symbols", len(entries.Packages.Names), len(entries.Symbols.Names))
	return nil
}
