package storage

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
)

const (
	// ExtWasm is wasm file extension
	ExtWasm = "wasm"
	// ExtGo is go file extension
	ExtGo = "go"
)

// ArtifactID represents artifact ID
type ArtifactID string

// Ext returns string with artifact ID and extension
func (a ArtifactID) Ext(ext string) string {
	return string(a) + "." + ext
}

// String returns string
func (a ArtifactID) String() string {
	return string(a)
}

// GetArtifactID generates new artifact ID from contents
func GetArtifactID(entries map[string][]byte) (ArtifactID, error) {
	h := md5.New()

	isFirst := true
	for name, contents := range entries {
		if !isFirst {
			_, _ = h.Write([]byte("\n"))
		}
		isFirst = false
		_, _ = h.Write([]byte("-- "))
		_, _ = h.Write([]byte(name))
		_, _ = h.Write([]byte(" --\n"))
		_, _ = h.Write(bytes.TrimSpace(contents))
	}
	fName := hex.EncodeToString(h.Sum(nil))
	return ArtifactID(fName), nil
}
