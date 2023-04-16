package buffutil

import (
	"bytes"
	"io/fs"
	"sync"
)

const defaultInitSize = 1024 * 1024

type BufferPool struct {
	buffInitSize int
	pool         sync.Pool
}

func NewBufferPoolWithSize(buffInitSize int) *BufferPool {
	return &BufferPool{
		buffInitSize: buffInitSize,
		pool: sync.Pool{
			New: func() any {
				return &bytes.Buffer{}
			},
		},
	}
}

func NewBufferPool() *BufferPool {
	return NewBufferPoolWithSize(defaultInitSize)
}

func (p *BufferPool) Get() RecyclableBuffer {
	buff := p.pool.Get().(*bytes.Buffer)
	buff.Grow(p.buffInitSize)

	return RecyclableBuffer{
		Buffer: buff,
		pool:   p,
	}
}

func (p *BufferPool) Put(b RecyclableBuffer) {
	if b.Buffer == nil {
		panic("BufferPool.Put: RecyclableBuffer was already recycled")
	}

	b.Buffer.Reset()
	p.pool.Put(b.Buffer)
	b.pool = nil
	b.Buffer = nil
}

type RecyclableBuffer struct {
	*bytes.Buffer

	pool *BufferPool
}

func (b RecyclableBuffer) Closed() bool {
	return b.Buffer != nil
}

func (b RecyclableBuffer) Close() error {
	if b.Buffer == nil || b.pool == nil {
		return fs.ErrClosed
	}

	b.pool.Put(b)
	return nil
}
