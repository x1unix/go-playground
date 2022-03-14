package webutil

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestValidateGTag(t *testing.T) {
	cases := map[string]bool{
		"EN-123456789-0":     true,
		`EN-123456789-0"/>`:  false,
		`EN-12345/foobar.js`: false,
		`foo.js`:             false,
	}
	for input, expect := range cases {
		t.Run(input, func(t *testing.T) {
			err := ValidateGTag(input)
			if !expect {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
		})
	}
}
