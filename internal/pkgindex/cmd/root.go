package cmd

import (
	"fmt"
	"os"
	"runtime/pprof"

	"github.com/spf13/cobra"
)

func newCmdRoot() *cobra.Command {
	f := new(globalFlags)
	cmd := &cobra.Command{
		SilenceUsage: true,
		Use:          "pkgindexer <mode> [-r goroot] [-o output]",
		Short:        "Go standard library packages scanner",
		Long:         "Tool to generate Go package autocomplete entries for Monaco editor from Go SDK",
		PersistentPreRunE: func(_ *cobra.Command, _ []string) (err error) {
			*f, err = f.withDefaults()
			return err
		},
		PersistentPostRunE: func(_ *cobra.Command, _ []string) error {
			return saveHeapProfile(f.heapProfFile)
		},
	}

	cmd.PersistentFlags().StringVarP(
		&f.goRoot, "root", "r", "", "Path to GOROOT. Uses $GOROOT by default",
	)
	cmd.PersistentFlags().StringVar(
		&f.heapProfFile, "prof", "", "Generate a heap profile into a file",
	)

	cmd.AddCommand(newCmdImports(f))
	cmd.AddCommand(newCmdIndex(f))
	return cmd
}

func saveHeapProfile(outFile string) error {
	if outFile == "" {
		return nil
	}

	f, err := os.OpenFile(outFile, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return fmt.Errorf("failed to create heap profile file: %w", err)
	}

	defer f.Close()
	if err := pprof.WriteHeapProfile(f); err != nil {
		return fmt.Errorf("failed to write heap profile to %q: %w", outFile, err)
	}

	return nil
}

func Run() error {
	cmd := newCmdRoot()
	return cmd.Execute()
}
