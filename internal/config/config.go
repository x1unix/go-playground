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

type HTTPConfig struct {
	// Addr is HTTP server listen address
	Addr string `envconfig:"APP_HTTP_ADDR" json:"addr"`

	// AssetsDir is directory which contains frontend assets
	AssetsDir string `envconfig:"APP_ASSETS_DIR" json:"assetsDir"`
}

func (cfg *HTTPConfig) mountFlagSet(f *flag.FlagSet) {
	wd, err := os.Getwd()
	if err != nil {
		wd = "."
	}

	f.StringVar(&cfg.Addr, "addr", ":8080", "TCP Listen address")
	f.StringVar(&cfg.AssetsDir, "static-dir", filepath.Join(wd, "public"), "Path to web page assets (HTML, JS, etc)")
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

	// PackagesFile is path to packages JSON index file
	PackagesFile string `envconfig:"APP_PKG_FILE" json:"packagesFile"`

	// CleanupInterval is WebAssembly build artifact cache clean interval
	CleanupInterval time.Duration `envconfig:"APP_CLEAN_INTERVAL" json:"cleanupInterval"`

	// BypassEnvVarsList is allow-list of environment variables
	// that will be passed to Go compiler.
	//
	// Empty value disables environment variable filter.
	BypassEnvVarsList []string `envconfig:"APP_PERMIT_ENV_VARS" json:"bypassEnvVarsList"`
}

func (cfg *BuildConfig) mountFlagSet(f *flag.FlagSet) {
	f.StringVar(&cfg.PackagesFile, "f", "packages.json", "Path to packages index JSON file")
	f.StringVar(&cfg.BuildDir, "wasm-build-dir", os.TempDir(), "Directory for WASM builds")
	f.DurationVar(&cfg.CleanupInterval, "clean-interval", 10*time.Minute, "Build directory cleanup interval")
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
