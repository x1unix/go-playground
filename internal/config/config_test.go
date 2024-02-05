package config

import (
	"flag"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zapcore"
)

func TestFromFlags(t *testing.T) {
	expect := Config{
		HTTP: HTTPConfig{
			Addr:      "testaddr",
			AssetsDir: "testdir",
		},
		Playground: PlaygroundConfig{
			PlaygroundURL:  "pgurl",
			ConnectTimeout: 2 * time.Hour,
		},
		Build: BuildConfig{
			BuildDir:          "builddir",
			PackagesFile:      "pkgfile",
			CleanupInterval:   1 * time.Hour,
			BypassEnvVarsList: []string{"FOO", "BAR"},
			SkipModuleCleanup: true,
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
		"-f=pkgfile",
		"-clean-interval=1h",
		"-permit-env-vars=FOO,BAR",
		"-gtag-id=GA-123456",
		"-debug",
		"-log-level=warn",
		"-log-format=console",
		"-sentry-dsn=testdsn",
		"-sentry-breadcrumbs=1",
		"-skip-mod-clean",
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
					Addr:      "testaddr",
					AssetsDir: "testdir",
				},
				Playground: PlaygroundConfig{
					PlaygroundURL:  "pgurl",
					ConnectTimeout: 2 * time.Hour,
				},
				Build: BuildConfig{
					BuildDir:          "builddir",
					PackagesFile:      "pkgfile",
					CleanupInterval:   1 * time.Hour,
					BypassEnvVarsList: []string{"FOO", "BAR"},
					SkipModuleCleanup: true,
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
				"APP_PKG_FILE":            "pkgfile",
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
