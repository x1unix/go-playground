package announcements

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestEncodeDecode(t *testing.T) {
	testAnnouncement := &Announcement{
		Key:  "test",
		Type: "info",
		Content: []MessagePart{
			{
				Type:  "text",
				Value: "hello world",
			},
		},
	}

	m := TextMarshaler{Value: testAnnouncement}
	encoded, err := m.MarshalText()
	require.NoError(t, err)
	require.NotEmpty(t, encoded)

	m.Value = nil
	err = m.UnmarshalText(encoded)
	require.NoError(t, err)
	require.Equal(t, testAnnouncement, m.Value)
}
