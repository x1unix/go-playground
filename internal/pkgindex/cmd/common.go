package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func writeOutput(flags importsFlags, data any) error {
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
