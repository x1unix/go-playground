package storage

import (
	"context"
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

// Artifact is a cached build artifact containing the binary and compiler output.
type Artifact struct {
	Contents       ReadCloseSizer
	CompilerOutput []byte
}

// StoreProvider is abstract artifact storage
type StoreProvider interface {
	// GetArtifact returns a cached artifact by id.
	// Returns ErrNotExists if the artifact is not in cache.
	GetArtifact(id ArtifactID) (*Artifact, error)

	// SetArtifact stores artifact metadata for an id.
	SetArtifact(id ArtifactID, e *Artifact) error

	// CreateWorkspace creates workspace entry in storage
	CreateWorkspace(id ArtifactID, files map[string][]byte) (*Workspace, error)

	// Clean truncates storage contents
	Clean(ctx context.Context) error
}
