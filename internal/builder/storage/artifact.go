package storage

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"sort"
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

	// Keys have to be sorted for constant hashing
	keys := make([]string, 0, len(entries))
	for key := range entries {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	for i, key := range keys {
		if i > 0 {
			_, _ = h.Write([]byte("\n"))
		}

		contents := bytes.TrimSpace(entries[key])
		_, _ = h.Write([]byte("-- "))
		_, _ = h.Write([]byte(key))
		_, _ = h.Write([]byte(" --\n"))
		_, _ = h.Write(contents)
	}

	fName := hex.EncodeToString(h.Sum(nil))
	return ArtifactID(fName), nil
}
