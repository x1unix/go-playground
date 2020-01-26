package storage

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
)

const (
	ExtWasm = "wasm"
	ExtGo   = "go"
)

// ArtifactID represents artifact ID
type ArtifactID string

// Ext returns string with artifact ID and extension
func (a ArtifactID) Ext(ext string) string {
	return string(a) + "." + ext
}

func (a ArtifactID) String() string {
	return string(a)
}

func GetArtifactID(data []byte) (ArtifactID, error) {
	h := md5.New()
	if _, err := h.Write(bytes.TrimSpace(data)); err != nil {
		return "", err
	}

	fName := hex.EncodeToString(h.Sum(nil))
	return ArtifactID(fName), nil
}
