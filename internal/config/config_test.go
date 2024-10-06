package config

import (
	"flag"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zapcore"
)

func TestFromFlags(t *testing.T) {
	expect := Config{
		HTTP: HTTPConfig{
			Addr:         "testaddr",
			AssetsDir:    "testdir",
			ReadTimeout:  7 * time.Second,
			WriteTimeout: 6 * time.Second,
			IdleTimeout:  3 * time.Second,
		},
		Playground: PlaygroundConfig{
			PlaygroundURL:  "pgurl",
			ConnectTimeout: 2 * time.Hour,
		},
		Build: BuildConfig{
			BuildDir:          "builddir",
			CleanupInterval:   1 * time.Hour,
			BypassEnvVarsList: []string{"FOO", "BAR"},
			SkipModuleCleanup: true,
			GoBuildTimeout:    4 * time.Second,
		},
		Services: ServicesConfig{GoogleAnalyticsID: "GA-123456"},
		Log: LogConfig{
			Debug:  true,
			Level:  zapcore.WarnLevel,
			Format: "console",
			Sentry: SentryConfig{
				DSN:            "testdsn",
				UseBreadcrumbs: true,
			},
		},
	}

	args := []string{
		"-addr=testaddr",
		"-static-dir=testdir",
		"-playground-url=pgurl",
		"-timeout=2h",
		"-wasm-build-dir=builddir",
		"-clean-interval=1h",
		"-permit-env-vars=FOO,BAR",
		"-gtag-id=GA-123456",
		"-debug",
		"-log-level=warn",
		"-log-format=console",
		"-sentry-dsn=testdsn",
		"-sentry-breadcrumbs=1",
		"-skip-mod-clean",
		"-http-read-timeout=7s",
		"-http-write-timeout=6s",
		"-http-idle-timeout=3s",
		"-go-build-timeout=4s",
	}

	fl := flag.NewFlagSet("app", flag.PanicOnError)
	got := FromFlagSet(fl)
	require.NoError(t, fl.Parse(args))
	require.NotNil(t, got)
	require.Equal(t, expect, *got)
}

func TestFromEnv(t *testing.T) {
	cases := map[string]struct {
		expect    Config
		input     *Config
		expectErr string
		env       map[string]string
	}{
		"validate input fields": {
			expectErr: "failed to load config from environment",
			env: map[string]string{
				"APP_LOG_LEVEL": "badlevel",
			},
		},
		"utilize input value": {
			input: &Config{
				HTTP: HTTPConfig{
					Addr:      "oldaddr1",
					AssetsDir: "olddir1",
				},
			},
			expect: Config{
				HTTP: HTTPConfig{
					Addr:      "newaddr1",
					AssetsDir: "olddir1",
				},
			},
			env: map[string]string{
				"APP_HTTP_ADDR": "newaddr1",
			},
		},
		"process environment variables": {
			expect: Config{
				HTTP: HTTPConfig{
					Addr:         "testaddr",
					AssetsDir:    "testdir",
					ReadTimeout:  21 * time.Second,
					WriteTimeout: 22 * time.Second,
					IdleTimeout:  23 * time.Second,
				},
				Playground: PlaygroundConfig{
					PlaygroundURL:  "pgurl",
					ConnectTimeout: 2 * time.Hour,
				},
				Build: BuildConfig{
					BuildDir:          "builddir",
					CleanupInterval:   1 * time.Hour,
					BypassEnvVarsList: []string{"FOO", "BAR"},
					SkipModuleCleanup: true,
					GoBuildTimeout:    time.Hour,
				},
				Services: ServicesConfig{GoogleAnalyticsID: "GA-123456"},
				Log: LogConfig{
					Debug:  true,
					Level:  zapcore.WarnLevel,
					Format: "console",
					Sentry: SentryConfig{
						DSN:             "testdsn",
						UseBreadcrumbs:  true,
						BreadcrumbLevel: zapcore.DebugLevel,
					},
				},
			},
			env: map[string]string{
				"APP_HTTP_ADDR":           "testaddr",
				"APP_ASSETS_DIR":          "testdir",
				"APP_PLAYGROUND_URL":      "pgurl",
				"APP_PLAYGROUND_TIMEOUT":  "2h",
				"APP_BUILD_DIR":           "builddir",
				"APP_CLEAN_INTERVAL":      "1h",
				"APP_PERMIT_ENV_VARS":     "FOO,BAR",
				"APP_GTAG_ID":             "GA-123456",
				"APP_DEBUG":               "1",
				"APP_LOG_LEVEL":           "warn",
				"APP_LOG_FORMAT":          "console",
				"APP_SKIP_MOD_CLEANUP":    "true",
				"SENTRY_DSN":              "testdsn",
				"SENTRY_USE_BREADCRUMBS":  "1",
				"SENTRY_BREADCRUMB_LEVEL": "debug",
				"HTTP_READ_TIMEOUT":       "21s",
				"HTTP_WRITE_TIMEOUT":      "22s",
				"HTTP_IDLE_TIMEOUT":       "23s",
				"APP_GO_BUILD_TIMEOUT":    "1h",
			},
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			for name, val := range c.env {
				t.Setenv(name, val)
			}

			got, err := FromEnv(c.input)
			if c.expectErr != "" {
				require.Error(t, err)
				require.Contains(t, err.Error(), c.expectErr)
				return
			}
			require.NoError(t, err)
			require.NotNil(t, got)
			require.Equal(t, c.expect, *got)
		})
	}
}

func TestConfig_Validate(t *testing.T) {
	cases := map[string]struct {
		cfg       func(t *testing.T) Config
		expectErr string
	}{
		"default config is valid": {
			cfg: func(t *testing.T) Config {
				fset := flag.NewFlagSet("foo", flag.PanicOnError)
				cfg := FromFlagSet(fset)
				require.NoError(t, fset.Parse([]string{"foo"}))
				require.NotNil(t, cfg)
				return *cfg
			},
		},
		"go build timeout": {
			expectErr: fmt.Sprintf(
				"go build timeout (%s) exceeds HTTP response timeout (%s)",
				time.Hour, time.Second,
			),
			cfg: func(_ *testing.T) Config {
				return Config{
					Build: BuildConfig{
						GoBuildTimeout: time.Hour,
					},
					HTTP: HTTPConfig{
						WriteTimeout: time.Second,
					},
				}
			},
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			err := c.cfg(t).Validate()
			if c.expectErr == "" {
				require.NoError(t, err)
				return
			}

			require.EqualError(t, err, c.expectErr)
		})
	}
}
