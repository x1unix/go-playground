package cmd

import (
	"fmt"

	"github.com/x1unix/go-playground/internal/pkgindex/imports"
)

const (
	formatJSON  = "json"
	formatProto = "proto"
)

type globalFlags struct {
	goRoot string
}

func (f globalFlags) withDefaults() (globalFlags, error) {
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

type importsFlags struct {
	*globalFlags
	prettyPrint bool
	stdout      bool
	outFile     string
}

func (f importsFlags) validate() error {
	if f.outFile == "" && !f.stdout {
		return fmt.Errorf("missing output file flag. Use --stdout flag to print into stdout")
	}

	if f.stdout && f.outFile != "" {
		return fmt.Errorf("ambiguous output flag: --stdout and output file flag can't be together")
	}

	return nil
}

type indexFlags struct {
	importsFlags

	format string
}

func (f indexFlags) validate() error {
	switch f.format {
	case "proto":
		if f.stdout {
			return fmt.Errorf("--stdout flag not allowed for Protobuf format")
		}
		if f.prettyPrint {
			return fmt.Errorf("pretty print is not avaiable for Protobuf format")
		}
		if f.outFile == "" {
			return fmt.Errorf("missing output file flag")
		}
		return nil
	case "", "json":
		if f.outFile == "" && !f.stdout {
			return fmt.Errorf("missing output file flag. Use --stdout flag to print into stdout")
		}

		if f.stdout && f.outFile != "" {
			return fmt.Errorf("ambiguous output flag: --stdout and output file flag can't be together")
		}
	default:
		return fmt.Errorf("unsupported output format %q", f.format)
	}

	return nil
}
