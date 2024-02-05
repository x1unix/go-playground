package storage

import (
	"errors"
	"io"
)

// ErrNotExists is item not found error
var ErrNotExists = errors.New("item not exists")

type Workspace struct {
	// WorkDir is workspace directory
	WorkDir string

	// BinaryPath is absolute path for output binary file.
	BinaryPath string

	// Files is list of files in workspace
	Files []string
}

// Callback is location callback
type Callback = func(workspace Workspace) error

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

	// CreateWorkspace creates workspace entry in storage
	CreateWorkspace(id ArtifactID, files map[string][]byte) (*Workspace, error)
}
