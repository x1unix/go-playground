package pkgindex

type queue struct {
	entries []string
}

func newQueue(size int) queue {
	return queue{entries: make([]string, 0, size)}
}

func (q *queue) occupied() bool {
	return len(q.entries) != 0
}

func (q *queue) pop() (string, bool) {
	if len(q.entries) == 0 {
		return "", false
	}

	entry := q.entries[0]
	q.entries = q.entries[1:]
	return entry, true
}

func (q *queue) add(items ...string) {
	if len(items) == 0 {
		return
	}

	q.entries = append(q.entries, items...)
}
