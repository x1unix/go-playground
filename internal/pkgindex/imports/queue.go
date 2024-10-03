package imports

type Queue[T any] struct {
	entries []T
	max     int
}

func NewQueue[T any](size int) *Queue[T] {
	return &Queue[T]{entries: make([]T, 0, size)}
}

func (q *Queue[T]) Occupied() bool {
	return len(q.entries) != 0
}

func (q *Queue[T]) MaxOccupancy() int {
	return q.max
}

func (q *Queue[T]) Pop() (val T, ok bool) {
	if len(q.entries) == 0 {
		return val, false
	}

	entry := q.entries[0]
	q.entries = q.entries[1:]
	return entry, true
}

func (q *Queue[T]) Add(items ...T) {
	if len(items) == 0 {
		return
	}

	q.entries = append(q.entries, items...)
	q.max = max(len(q.entries), q.max)
}
