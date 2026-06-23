package builder

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseCompilerOptions(t *testing.T) {
	cases := map[string]struct {
		input   string
		want    []string
		wantErr string
	}{
		"empty": {
			input: "",
			want:  nil,
		},
		"inline values": {
			input: `-gcflags='all=-N -l' -tags=debug -trimpath`,
			want:  []string{"-gcflags=all=-N -l", "-tags=debug", "-trimpath"},
		},
		"separate values": {
			input: `-ldflags "-s -w" -asmflags all=-trimpath=/tmp`,
			want:  []string{"-ldflags", "-s -w", "-asmflags", "all=-trimpath=/tmp"},
		},
		"unsupported flag": {
			input:   "-toolexec=/tmp/evil",
			wantErr: `unsupported compiler option "-toolexec"`,
		},
		"missing value": {
			input:   "-gcflags",
			wantErr: `compiler option "-gcflags" requires a value`,
		},
		"unexpected value": {
			input:   "-trimpath=true",
			wantErr: `compiler option "-trimpath" does not accept a value`,
		},
		"unterminated quote": {
			input:   `-gcflags="all=-N -l`,
			wantErr: "unterminated quoted string",
		},
	}

	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			got, err := ParseCompilerOptions(tc.input)
			if tc.wantErr != "" {
				require.Error(t, err)
				require.Contains(t, err.Error(), tc.wantErr)
				return
			}

			require.NoError(t, err)
			require.Equal(t, tc.want, got)
		})
	}
}
