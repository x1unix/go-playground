package analyzer

import (
	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/testutil"
	"testing"
)

func TestSetLogger(t *testing.T) {
	l := testutil.GetLogger(t).Desugar()
	SetLogger(l)
	require.Equal(t, log, l)
}

func TestSetRoot(t *testing.T) {
	root := "/go"
	SetRoot(root)
	require.Equal(t, root, goRoot)
}
