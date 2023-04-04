package syncx

import "sync"

type void = struct{}

type Set[T comparable] struct {
	m *sync.Map
}

func NewSet[T comparable]() Set[T] {
	return Set[T]{
		m: &sync.Map{},
	}
}

func (s Set[T]) Delete(item T) {
	s.m.Delete(item)
}

func (s Set[T]) Has(item T) bool {
	_, ok := s.m.Load(item)
	return ok
}

func (s Set[T]) Add(item T) {
	s.m.Store(item, void{})
}
