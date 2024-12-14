package backendinfo

import "context"

type BackendVersions struct {
	// CurrentStable is latest stable Go version.
	CurrentStable string

	// PreviousStable is previous stable Go version.
	PreviousStable string

	// Nightly is latest unstable Go version (tip) version.
	Nightly string
}

type BackendVersionProvider interface {
	// GetRemoteVersions returns Go version used on remote Go backends.
	GetRemoteVersions(ctx context.Context) (*BackendVersions, error)

	// ServerVersion returns Go version used on server.
	ServerVersion() string
}
