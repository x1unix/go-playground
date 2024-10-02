package docutil

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestComposedFilter_Ignore(t *testing.T) {
	filters := ComposeFilters(UnexportedFilter{}, NewIgnoreList("Foo"))

	require.True(t, filters.Ignore("Foo"))
	require.True(t, filters.Ignore("bar"))
	require.False(t, filters.Ignore("Baz"))
}

func TestIgnoreList_Ignore(t *testing.T) {
	f := NewIgnoreList("Foo", "Bar")
	require.True(t, f.Ignore("Foo"))
	require.True(t, f.Ignore("Bar"))
	require.False(t, f.Ignore("Baz"))
}
