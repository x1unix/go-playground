package analyzer

// SymbolIndex is Go symbols index
type SymbolIndex struct {
	Symbols []*CompletionItem
	nameMap map[string]*CompletionItem
	charMap map[string][]*CompletionItem
}

// Len returns symbols length
func (si *SymbolIndex) Len() int {
	return len(si.Symbols)
}

func emptySymbolIndex() SymbolIndex {
	return SymbolIndex{
		Symbols: []*CompletionItem{},
		nameMap: map[string]*CompletionItem{},
		charMap: map[string][]*CompletionItem{},
	}
}

// NewSymbolIndex creates a new symbol index from completion items
func NewSymbolIndex(items []*CompletionItem) SymbolIndex {
	idx := SymbolIndex{
		Symbols: items,
		nameMap: make(map[string]*CompletionItem, len(items)),
		charMap: make(map[string][]*CompletionItem),
	}

	for _, sym := range items {
		firstChar := sym.Label[:1]
		idx.nameMap[sym.Label] = sym
		idx.charMap[firstChar] = append(idx.charMap[firstChar], sym)
	}

	return idx
}

// Append appends symbols to index
func (si *SymbolIndex) Append(items ...*CompletionItem) {
	for _, i := range items {
		if i == nil {
			continue
		}
		firstChar := i.Label[:1]
		si.Symbols = append(si.Symbols, i)
		si.nameMap[i.Label] = i
		si.charMap[firstChar] = append(si.charMap[firstChar], i)
	}
}

// SymbolByName returns symbol by name
func (si SymbolIndex) SymbolByName(name string) *CompletionItem {
	return si.nameMap[name]
}

// Match matches symbols by prefix char
func (si SymbolIndex) Match(char string) []*CompletionItem {
	return si.charMap[char]
}
