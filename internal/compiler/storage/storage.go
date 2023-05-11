package storage

import (
	"errors"
	"io"
)

// ErrNotExists is item not found error
var ErrNotExists = errors.New("item not exists")

// Callback is location callback
type Callback = func(wasmLocation, sourceLocation string) error

type ReadCloseSizer interface {
	io.ReadCloser

	Size() int64
}

// StoreProvider is abstract artifact storage
type StoreProvider interface {
	// HasItem checks if item exists
	HasItem(id ArtifactID) (bool, error)

	// GetItem returns item by id
	GetItem(id ArtifactID) (ReadCloseSizer, error)

	// CreateLocationAndDo creates entry in storage and runs specified callback with new location
	CreateLocationAndDo(id ArtifactID, data []byte, cb Callback) error
}
