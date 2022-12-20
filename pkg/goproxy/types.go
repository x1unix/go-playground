package goproxy

import (
	"io"
	"time"
)

type VersionInfo struct {
	Version string    `json:"Version"`
	Time    time.Time `json:"Time"`
}

type ArchiveReadCloser struct {
	io.ReadCloser

	// Size is content length in bytes.
	Size int64

	// ContentType is archive content type.
	ContentType string
}
