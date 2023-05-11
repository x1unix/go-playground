package compiler

import (
	"context"
	"runtime"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLookupEnv(t *testing.T) {
	cases := map[string]struct {
		envName     string
		expectErr   string
		expectValue string
		beforeRun   func(t *testing.T)
	}{
		"read value from shell": {
			envName:     "FOO",
			expectValue: "FOOBAR",
			beforeRun: func(t *testing.T) {
				t.Setenv("FOO", "FOOBAR")
			},
		},
		"fallback to go env tool": {
			envName:     "GOHOSTOS",
			expectValue: runtime.GOOS,
		},
		"failed to call go tool": {
			envName:   "GOHOSTARCH",
			expectErr: `command "go env GOHOSTARCH" returned an error`,
			beforeRun: func(t *testing.T) {
				// "go test" sets all env vars before run
				t.Setenv("GOHOSTARCH", "")
				// Break path lookup to simulate error
				t.Setenv("PATH", ".")
			},
		},
		"undefined variable": {
			envName:   "THIS_ENV_VAR_SHOULD_NOT_EXIST",
			expectErr: ErrUndefinedEnvVariable.Error(),
		},
	}

	for k, v := range cases {
		t.Run(k, func(t *testing.T) {
			if v.beforeRun != nil {
				v.beforeRun(t)
			}
			got, err := LookupEnv(context.Background(), v.envName)
			if v.expectErr != "" {
				require.Error(t, err)
				require.True(t, strings.Contains(err.Error(), v.expectErr),
					"error %q should include %q", err.Error(), v.expectErr)
				return
			}
			require.NoError(t, err)
			require.Equal(t, v.expectValue, got)
		})
	}
}
