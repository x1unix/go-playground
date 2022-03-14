package util

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNewStringSet(t *testing.T) {
	s := NewStringSet("foo", "bar")
	require.Equal(t, StringSet{
		"foo": void{},
		"bar": void{},
	}, s)
}

func TestStringSet_Has(t *testing.T) {
	s := NewStringSet("foo")
	require.True(t, s.Has("foo"))
	require.False(t, s.Has("bar"))
	require.False(t, StringSet.Has(nil, "foo"))
}

func TestStringSet_Concat(t *testing.T) {
	a := NewStringSet("foo", "bar")
	b := NewStringSet("bar", "baz")
	expect := NewStringSet("foo", "bar", "baz")
	got := a.Concat(b)
	require.Equal(t, expect, got)
}
