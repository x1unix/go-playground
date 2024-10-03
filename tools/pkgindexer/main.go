package main

import (
	"os"

	"github.com/x1unix/go-playground/internal/pkgindex/cmd"
)

func main() {
	if err := cmd.Run(); err != nil {
		os.Exit(2)
	}
}
