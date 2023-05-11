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

type Map[K comparable, V any] struct {
	m *sync.Map
}

func NewMap[K comparable, V any]() Map[K, V] {
	return Map[K, V]{
		m: new(sync.Map),
	}
}

func (m Map[K, V]) Put(key K, val V) {
	m.m.Store(key, val)
}

func (m Map[K, V]) Delete(item K) {
	m.m.Delete(item)
}

func (m Map[K, V]) Has(item K) bool {
	_, ok := m.m.Load(item)
	return ok
}

func (m Map[K, V]) Get(item K) (V, bool) {
	v, ok := m.m.Load(item)
	return v.(V), ok
}
