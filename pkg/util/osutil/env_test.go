package osutil

import (
	"os"
	"sort"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSplitEnvironmentValues(t *testing.T) {
	cases := map[string]struct {
		allowList []string
		input     []string
		expect    EnvironmentVariables
	}{
		"with ignore list": {
			allowList: []string{
				"FOO",
				"BAR",
				"EMPTY",
			},
			input: []string{
				"FOO=BAR",
				"BAR=BAZ=BBB",
				"EMPTY=",
				"VALUE_SHOULD_BE_IGNORED",
				"ALSO_IGNORE=ME=PLEASE",
			},
			expect: EnvironmentVariables{
				"FOO":   "BAR",
				"BAR":   "BAZ=BBB",
				"EMPTY": "",
			},
		},
		"without ignore list": {
			input: []string{
				"FOO=BAR",
				"BAR=BAZ=BBB",
				"EMPTY=",
			},
			expect: EnvironmentVariables{
				"FOO":   "BAR",
				"BAR":   "BAZ=BBB",
				"EMPTY": "",
			},
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			got := SplitEnvironmentValues(c.input, c.allowList...)
			require.Equal(t, c.expect, got)
		})
	}
}

func TestSelectEnvironmentVariables(t *testing.T) {
	allowList := []string{"GOOS", "GOARCH", "GOPATH"}
	expect := SplitEnvironmentValues(os.Environ(), allowList...)
	got := SelectEnvironmentVariables(allowList...)
	require.Equal(t, expect, got)
}

func TestEnvironmentVariables_Join(t *testing.T) {
	expect := []string{
		"B=2",
		"A=1",
	}
	got := EnvironmentVariables{
		"A": "1",
		"B": "2",
	}.Join()

	// sort items to mitigate random map iteration issue
	sort.Strings(got)
	sort.Strings(expect)
	require.Equal(t, expect, got)
}

func TestEnvironmentVariables_Append(t *testing.T) {
	expect := EnvironmentVariables{
		"FOO": "BAR",
		"BAR": "BAZ",
	}
	got := EnvironmentVariables{"BAR": "BAZ"}
	EnvironmentVariables.Append(nil, nil)
	EnvironmentVariables.Append(got, nil)
	EnvironmentVariables.Append(got, EnvironmentVariables{"FOO": "BAR"})

	require.Equal(t, expect, got)
}
