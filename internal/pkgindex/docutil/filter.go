package docutil

import (
	"go/token"

	"github.com/hashicorp/go-set/v3"
)

// Filter is interface to provide way to ignore certain symbols during AST traversal.
type Filter interface {
	Ignore(typeName string) bool
}

type ignoreList struct {
	m *set.Set[string]
}

func (f ignoreList) Ignore(typeName string) bool {
	return f.m.Contains(typeName)
}

// NewIgnoreList creates a filter with a list of ignored symbols.
func NewIgnoreList(names ...string) Filter {
	return ignoreList{
		m: set.From(names),
	}
}

// UnexportedFilter filters private symbols
type UnexportedFilter struct{}

func (_ UnexportedFilter) Ignore(typeName string) bool {
	return !token.IsExported(typeName)
}

type composedFilter []Filter

func (filters composedFilter) Ignore(typeName string) bool {
	for _, f := range filters {
		if f.Ignore(typeName) {
			return true
		}
	}

	return false
}

// ComposeFilters allows composing multiple symbol filters into one.
func ComposeFilters(filters ...Filter) Filter {
	return composedFilter(filters)
}

func filterOrDefault(f Filter) Filter {
	if f != nil {
		return f
	}

	return UnexportedFilter{}
}
