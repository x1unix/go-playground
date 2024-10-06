package config

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/kelseyhightower/envconfig"
	"github.com/x1unix/go-playground/pkg/goplay"
	"github.com/x1unix/go-playground/pkg/util/cmdutil"
)

const (
	DefaultWriteTimeout   = 60 * time.Second
	DefaultReadTimeout    = 15 * time.Second
	DefaultIdleTimeout    = 90 * time.Second
	DefaultGoBuildTimeout = 40 * time.Second
	DefaultCleanInterval  = 10 * time.Minute
)

type HTTPConfig struct {
	// Addr is HTTP server listen address
	Addr string `envconfig:"APP_HTTP_ADDR" json:"addr"`

	// AssetsDir is directory which contains frontend assets
	AssetsDir string `envconfig:"APP_ASSETS_DIR" json:"assetsDir"`

	// WriteTimeout is HTTP response write timeout.
	WriteTimeout time.Duration `envconfig:"HTTP_WRITE_TIMEOUT"`

	// ReadTimeout is HTTP request read timeout.
	ReadTimeout time.Duration `envconfig:"HTTP_READ_TIMEOUT"`

	// IdleTimeout is delay timeout between requests to keep connection alive.
	IdleTimeout time.Duration `envconfig:"HTTP_IDLE_TIMEOUT"`
}

func (cfg *HTTPConfig) mountFlagSet(f *flag.FlagSet) {
	wd, err := os.Getwd()
	if err != nil {
		wd = "."
	}

	f.StringVar(&cfg.Addr, "addr", ":8080", "TCP Listen address")
	f.StringVar(&cfg.AssetsDir, "static-dir", filepath.Join(wd, "public"), "Path to web page assets (HTML, JS, etc)")
	f.DurationVar(&cfg.WriteTimeout, "http-write-timeout", DefaultWriteTimeout, "HTTP response write timeout")
	f.DurationVar(&cfg.ReadTimeout, "http-read-timeout", DefaultReadTimeout, "HTTP request read timeout")
	f.DurationVar(&cfg.IdleTimeout, "http-idle-timeout", DefaultIdleTimeout, "HTTP keep alive timeout")
}

type PlaygroundConfig struct {
	// PlaygroundURL is Go playground server URL
	PlaygroundURL string `envconfig:"APP_PLAYGROUND_URL" json:"playgroundUrl"`

	// ConnectTimeout is HTTP request timeout for playground requests
	ConnectTimeout time.Duration `envconfig:"APP_PLAYGROUND_TIMEOUT" json:"connectTimeout"`
}

func (cfg *PlaygroundConfig) mountFlagSet(f *flag.FlagSet) {
	f.StringVar(&cfg.PlaygroundURL, "playground-url", goplay.DefaultPlaygroundURL, "Go Playground URL")
	f.DurationVar(&cfg.ConnectTimeout, "timeout", 15*time.Second, "Go Playground server connect timeout")
}

type BuildConfig struct {
	// BuildDir is path to directory to cache WebAssembly builds
	BuildDir string `envconfig:"APP_BUILD_DIR" json:"buildDir"`

	// CleanupInterval is WebAssembly build artifact cache clean interval
	CleanupInterval time.Duration `envconfig:"APP_CLEAN_INTERVAL" json:"cleanupInterval"`

	// GoBuildTimeout is Go program build timeout.
	GoBuildTimeout time.Duration `envconfig:"APP_GO_BUILD_TIMEOUT" json:"goBuildTimeout"`

	// SkipModuleCleanup disables Go module cache cleanup.
	SkipModuleCleanup bool `envconfig:"APP_SKIP_MOD_CLEANUP" json:"skipModuleCleanup"`

	// BypassEnvVarsList is allow-list of environment variables
	// that will be passed to Go compiler.
	//
	// Empty value disables environment variable filter.
	BypassEnvVarsList []string `envconfig:"APP_PERMIT_ENV_VARS" json:"bypassEnvVarsList"`
}

func (cfg *BuildConfig) mountFlagSet(f *flag.FlagSet) {
	f.StringVar(&cfg.BuildDir, "wasm-build-dir", os.TempDir(), "Directory for WASM builds")
	f.BoolVar(&cfg.SkipModuleCleanup, "skip-mod-clean", false, "Skip Go module cache cleanup")
	f.DurationVar(&cfg.CleanupInterval, "clean-interval", DefaultCleanInterval, "Build directory cleanup interval")
	f.DurationVar(&cfg.GoBuildTimeout, "go-build-timeout", DefaultGoBuildTimeout, "Go program build timeout.")
	f.Var(cmdutil.NewStringsListValue(&cfg.BypassEnvVarsList), "permit-env-vars", "Comma-separated allow list of environment variables passed to Go compiler tool")
}

type ServicesConfig struct {
	// GoogleAnalyticsID is Google Analytics tag ID (optional)
	GoogleAnalyticsID string `envconfig:"APP_GTAG_ID" json:"googleAnalyticsID"`
}

func (cfg *ServicesConfig) mountFlagSet(f *flag.FlagSet) {
	f.StringVar(&cfg.GoogleAnalyticsID, "gtag-id", "", "Google Analytics tag ID (optional)")
}

type Config struct {
	HTTP       HTTPConfig       `json:"http"`
	Playground PlaygroundConfig `json:"playground"`
	Build      BuildConfig      `json:"build"`
	Log        LogConfig        `json:"log"`
	Services   ServicesConfig   `json:"services"`
}

// Validate validates a config and returns error if config is invalid.
func (cfg Config) Validate() error {
	if cfg.Build.GoBuildTimeout > cfg.HTTP.WriteTimeout {
		return fmt.Errorf(
			"go build timeout (%s) exceeds HTTP response timeout (%s)",
			cfg.Build.GoBuildTimeout, cfg.HTTP.WriteTimeout,
		)
	}

	return nil
}

// FromFlagSet returns config file which will read values from flags
// when flag.Parse will be called.
func FromFlagSet(f *flag.FlagSet) *Config {
	var cfg Config
	cfg.HTTP.mountFlagSet(f)
	cfg.Playground.mountFlagSet(f)
	cfg.Build.mountFlagSet(f)
	cfg.Log.mountFlagSet(f)
	cfg.Services.mountFlagSet(f)
	return &cfg
}

// FromFlags return config from parsed process arguments.
func FromFlags() *Config {
	cfg := FromFlagSet(flag.CommandLine)
	flag.Parse()
	return cfg
}

// FromEnv populates config with values from environment variables.
//
// If passed config is nil - a new config will be returned.
func FromEnv(input *Config) (*Config, error) {
	if input == nil {
		input = new(Config)
	}

	if err := envconfig.Process("", input); err != nil {
		return nil, fmt.Errorf("failed to load config from environment: %w", err)
	}

	return input, nil
}
