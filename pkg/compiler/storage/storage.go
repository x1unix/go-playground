package storage

import (
	"errors"
	"io"
)

var ErrNotExists = errors.New("item not exists")

type Callback = func(wasmLocation, sourceLocation string) error

type StoreProvider interface {
	GetItem(id ArtifactID) (io.ReadCloser, error)
	CreateLocationAndDo(id ArtifactID, data []byte, cb Callback) error
}
