package pacman

import (
	"bytes"
	"sync"
)

const initBufferSize = 1024 * 1024

var pool = &sync.Pool{
	New: func() any {
		return &bytes.Buffer{}
	},
}

type poolBuffer struct {
	*bytes.Buffer

	pool *sync.Pool
}

func (b poolBuffer) Close() error {
	b.Buffer.Reset()
	b.pool.Put(b.Buffer)
	b.pool = nil
	return nil
}

func bufferFromPoolWithSize(minSize int) poolBuffer {
	v := pool.Get().(*bytes.Buffer)
	v.Grow(minSize)

	return poolBuffer{
		Buffer: v,
		pool:   pool,
	}
}

func bufferFromPool() poolBuffer {
	return bufferFromPoolWithSize(initBufferSize)
}
