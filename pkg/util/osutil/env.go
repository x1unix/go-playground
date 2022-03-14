package osutil

import (
	"os"
	"strings"

	"github.com/x1unix/go-playground/pkg/util"
)

const envVarsDelimiter = "="

// EnvironmentVariables is a key-value pair of environment variable and value.
type EnvironmentVariables map[string]string

// Join returns slice of environment variable and values joined by delimiter (=).
func (s EnvironmentVariables) Join() []string {
	r := make([]string, 0, len(s))
	for key, value := range s {
		r = append(r, strings.Join([]string{key, value}, envVarsDelimiter))
	}
	return r
}

// Append appends new values to existing item.
func (s EnvironmentVariables) Append(items EnvironmentVariables) {
	if s == nil {
		return
	}
	if len(items) == 0 {
		return
	}
	for k, v := range items {
		s[k] = v
	}
}

// Concat joins two items together into a new one.
func (s EnvironmentVariables) Concat(newItems EnvironmentVariables) EnvironmentVariables {
	newList := make(EnvironmentVariables, len(s)+len(newItems))
	newList.Append(s)
	newList.Append(newItems)
	return newList
}

// SplitEnvironmentValues splits slice of '='-separated key-value items and returns key-value pair.
//
// Second optional parameter allows filter items.
func SplitEnvironmentValues(vals []string, filterKeys ...string) EnvironmentVariables {
	allowList := util.NewStringSet(filterKeys...)
	out := make(EnvironmentVariables, len(vals))
	for _, val := range vals {
		chunks := strings.SplitN(val, "=", 2)
		key := chunks[0]

		if len(allowList) > 0 && !allowList.Has(key) {
			continue
		}

		val := ""
		if len(chunks) == 2 {
			val = chunks[1]
		}
		out[key] = val
	}
	return out
}

// SelectEnvironmentVariables selects environment variables as key-value pair with whitelist filter.
func SelectEnvironmentVariables(filterKeys ...string) EnvironmentVariables {
	return SplitEnvironmentValues(os.Environ(), filterKeys...)
}
