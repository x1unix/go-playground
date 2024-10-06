package check

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCheck(t *testing.T) {
	got, err := Check("testdata/bad.txt")
	require.NoError(t, err)
	require.NotNil(t, got)
	require.True(t, got.HasErrors)
	require.NotEmpty(t, got.Markers)
}
