package syncx

import (
	"sync"
	"time"
)

// TTLValue is a simple cached value with expiration time.
type TTLValue[T any] struct {
	_ [0]func()

	value     T
	createdAt time.Time
	lock      sync.RWMutex
	ttl       time.Duration
}

// NewTTLValue constructs a new TTLValue
func NewTTLValue[T any](ttl time.Duration, initialValue T) *TTLValue[T] {
	return &TTLValue[T]{
		ttl:   ttl,
		value: initialValue,
	}
}

// Get returns stored value.
//
// Returns default empty value if TTL expired.
func (v *TTLValue[T]) Get() (result T) {
	v.lock.RLock()
	defer v.lock.RUnlock()

	// Handle uninitialized value
	if v.createdAt.IsZero() {
		return v.value
	}

	passed := time.Since(v.createdAt)
	if passed >= v.ttl {
		// Return empty value on expire
		return result
	}

	return v.value
}

// Set sets a new value and updates expiration time.
func (v *TTLValue[T]) Set(newValue T) {
	v.lock.Lock()
	defer v.lock.Unlock()

	v.createdAt = time.Now()
	v.value = newValue
}
