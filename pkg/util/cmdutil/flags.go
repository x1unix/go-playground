package cmdutil

import (
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
	for i, v := range vals {
		v = strings.TrimSpace(v)
		if v == "" {
			continue
		}
		vals[i] = v
	}

	*s = vals
	return nil
}

// NewStringsListValue returns a new StringsListValue
func NewStringsListValue(p *[]string) *StringsListValue {
	return (*StringsListValue)(p)
}
