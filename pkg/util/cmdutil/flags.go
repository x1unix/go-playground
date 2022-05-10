package cmdutil

import (
	"encoding"
	"strconv"
	"strings"
)

const csvSeparator = ","

// StringsListValue is comma-separated list of values that implements flag.Value interface.
type StringsListValue []string

// String implements flag.Value
func (s StringsListValue) String() string {
	if len(s) == 0 {
		return ""
	}

	return strconv.Quote(strings.Join(s, csvSeparator))
}

// Set implements flag.Value
func (s *StringsListValue) Set(s2 string) error {
	vals := strings.Split(s2, csvSeparator)
	filteredVals := make([]string, 0, len(vals))
	for _, v := range vals {
		v = strings.TrimSpace(v)
		if v == "" {
			continue
		}
		filteredVals = append(filteredVals, v)
	}

	*s = filteredVals
	return nil
}

// NewStringsListValue returns a new StringsListValue
func NewStringsListValue(p *[]string) *StringsListValue {
	return (*StringsListValue)(p)
}

// TextUnmarshalerValue is flag.Value adapter for values
// which implement encoding.TextUnmarshaler interface.
type TextUnmarshalerValue struct {
	dest encoding.TextUnmarshaler
}

func NewTextUnmarshalerValue(dest encoding.TextUnmarshaler) *TextUnmarshalerValue {
	return &TextUnmarshalerValue{dest: dest}
}

func (t *TextUnmarshalerValue) WithDefaults(defaultValue string) *TextUnmarshalerValue {
	_ = t.dest.UnmarshalText([]byte(defaultValue))
	return t
}

// Set implements flag.Value
func (t TextUnmarshalerValue) Set(v string) error {
	return t.dest.UnmarshalText([]byte(v))
}

// String implements flag.Value
func (t TextUnmarshalerValue) String() string {
	if m, ok := t.dest.(encoding.TextMarshaler); ok {
		v, _ := m.MarshalText()
		return strconv.Quote(string(v))
	}

	return ""
}
