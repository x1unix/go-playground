// The `embed` package lets us include files and directories
// directly in a Go binary at compile time.
// This is useful for bundling assets like templates,
// static files, or configuration data.
// In this example, we'll embed a JSON file with a list of
// fruits, decode it, and print the values.

package main

import (
	// The embed package enables embedding files into the final binary.
	"embed"
	// We'll decode the embedded JSON into a Go struct.
	"encoding/json"
	"fmt"
)

// Config matches the shape of data.json.
type Config struct {
	Fruits []string `json:"fruits"`
}

// `//go:embed` embeds the named file at compile time.
//
// The directive must be placed right above a variable declaration.
// Here we embed `data.json` into an in-memory file system.
//
//go:embed data.json
var files embed.FS

func main() {
	// Read the embedded file from the virtual file system.
	jsonData, err := files.ReadFile("data.json")
	if err != nil {
		panic(err)
	}

	// Decode the JSON bytes into a Go value.
	var cfg Config
	if err := json.Unmarshal(jsonData, &cfg); err != nil {
		panic(err)
	}

	// Print the loaded data.
	fmt.Println("Fruits:")
	for _, fruit := range cfg.Fruits {
		fmt.Printf("- %s\n", fruit)
	}
}
