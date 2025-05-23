package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/x1unix/go-playground/internal/announcements"
)

type flagValues struct {
	isDecode bool
	fileName string
}

func main() {
	vals := &flagValues{}
	flag.BoolVar(&vals.isDecode, "d", false, "Decode a given announcement file")
	flag.StringVar(&vals.fileName, "f", "", "File name")
	flag.Parse()

	if err := mainErr(vals); err != nil {
		log.Fatalln(err)
	}
}

func mainErr(vals *flagValues) error {
	if vals.fileName == "" {
		return errors.New("missing file name")
	}

	data, err := os.ReadFile(vals.fileName)
	if err != nil {
		return fmt.Errorf("can't open input file: %w", err)
	}

	if vals.isDecode {
		out, err := announcements.DecodeFromBase64(string(data))
		if err != nil {
			return err
		}

		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(out)
	}

	v := &announcements.Announcement{}
	if err := json.Unmarshal(data, v); err != nil {
		return fmt.Errorf("can't parse input announcement from JSON: %w", err)
	}

	if err := v.Validate(); err != nil {
		return err
	}

	out, err := announcements.Encode(v)
	if err != nil {
		return err
	}

	_, _ = fmt.Fprint(os.Stdout, out)
	return nil
}
