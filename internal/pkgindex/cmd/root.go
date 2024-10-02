package cmd

import (
	"github.com/spf13/cobra"
)

func newCmdRoot() *cobra.Command {
	f := new(globalFlags)
	cmd := &cobra.Command{
		SilenceUsage: true,
		Use:          "pkgindexer <mode> [-r goroot] [-o output]",
		Short:        "Go standard library packages scanner",
		Long:         "Tool to generate Go package autocomplete entries for Monaco editor from Go SDK",
		PersistentPreRunE: func(c *cobra.Command, args []string) (err error) {
			*f, err = f.withDefaults()
			return err
		},
	}

	cmd.PersistentFlags().StringVarP(
		&f.goRoot, "root", "r", "", "Path to GOROOT. Uses $GOROOT by default",
	)

	cmd.AddCommand(newCmdImports(f))
	cmd.AddCommand(newCmdIndex(f))
	return cmd
}

func Run() error {
	cmd := newCmdRoot()
	return cmd.Execute()
}
