package buffutil

import (
	"sync"
)

type SlicePool[T any] struct {
	initCap int
	pool    sync.Pool
}

func NewSlicePool[T any](initCap int) *SlicePool[T] {
	return &SlicePool[T]{
		initCap: initCap,
		pool: sync.Pool{
			New: func() any {
				return make([]T, 0, initCap)
			},
		},
	}
}

func (p *SlicePool[T]) Get() []T {
	return p.pool.Get().([]T)
}

func (p *SlicePool[T]) Put(v []T) {
	v = v[:0]
	//nolint:staticcheck
	p.pool.Put(v)
}
