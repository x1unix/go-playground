package analyzer

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSymbolIndex(t *testing.T) {
	syms := []*CompletionItem{
		{Label: "foo"},
		{Label: "bar"},
		{Label: "baz"},
	}

	index := newSymbolIndex(syms)
	require.Equal(t, syms, index.Symbols)
	require.Equal(t, len(syms), index.Len())

	expectSymbols := make(map[string][]*CompletionItem, len(syms))

	for _, s := range syms {
		got := index.SymbolByName(s.Label)
		require.NotNil(t, got)
		require.Equal(t, s, got)

		char := string(s.Label[0])
		expectSymbols[char] = append(expectSymbols[char], s)
	}

	for char, expect := range expectSymbols {
		match := index.Match(char)
		require.Equal(t, expect, match)
	}
}

func TestSymbolIndex_Append(t *testing.T) {
	idx := emptySymbolIndex()
	sym := &CompletionItem{Label: "test"}
	idx.Append(sym)
	idx.Append(nil)
	require.Equal(t, 1, idx.Len())
	got := idx.SymbolByName(sym.Label)
	require.NotNil(t, got)
	require.Equal(t, sym, got)
}
