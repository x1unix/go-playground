package util

type void = struct{}

// StringSet is a list of unique strings.
type StringSet map[string]void

// Has checks if set contains a value.
func (s StringSet) Has(val string) bool {
	if s == nil {
		return false
	}

	_, ok := s[val]
	return ok
}

// Concat joins two string sets together into a new set.
func (s StringSet) Concat(items StringSet) StringSet {
	newList := make(StringSet, len(s)+len(items))
	for k, v := range s {
		newList[k] = v
	}
	for k, v := range items {
		newList[k] = v
	}
	return newList
}

// NewStringSet creates a new string set from strings slice.
func NewStringSet(items ...string) StringSet {
	if len(items) == 0 {
		return StringSet{}
	}

	s := make(StringSet, len(items))
	for _, v := range items {
		s[v] = void{}
	}
	return s
}
