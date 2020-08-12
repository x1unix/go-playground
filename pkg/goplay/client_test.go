package goplay

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNewDefaultClient(t *testing.T) {
	c := NewDefaultClient()
	require.Equal(t, c.baseUrl, playgroundUrl)
	require.Equal(t, c.userAgent, defaultUserAgent)
}
