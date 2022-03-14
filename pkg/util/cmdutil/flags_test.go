package cmdutil

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestStringsListValue_String(t *testing.T) {
	require.Equal(t, StringsListValue.String(nil), "")
	vals := []string{"foo", "bar"}
	require.Equal(t, StringsListValue(vals).String(), `"foo,bar"`)
}

func TestStringsListValue_Set(t *testing.T) {
	input := "foo, , bar,"
	expect := []string{"foo", "bar"}

	val := make(StringsListValue, 0)
	require.NoError(t, val.Set(input))
	require.Equal(t, expect, ([]string)(val))
}

func TestNewStringsListValue(t *testing.T) {
	val := []string{"foo"}
	got := NewStringsListValue(&val)
	require.Equal(t, (*[]string)(got), &val)
}
