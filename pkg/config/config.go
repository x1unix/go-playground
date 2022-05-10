package config

import (
	"flag"
	"github.com/x1unix/go-playground/pkg/goplay"
	"github.com/x1unix/go-playground/pkg/util/cmdutil"
	"os"
	"path/filepath"
	"time"
)

type HTTPConfig struct {
	DisableCORS bool
	Addr        string
	AssetsDir   string
}

func (cfg *HTTPConfig) mountFlagSet(f *flag.FlagSet) {

}

type PlaygroundConfig struct {
	PlaygroundURL      string
	GoTipPlaygroundURL string
	ConnectTimeout     time.Duration
}

func (cfg *PlaygroundConfig) mountFlagSet(f *flag.FlagSet) {
	f.StringVar(&cfg.PlaygroundURL, "playground-url", goplay.DefaultPlaygroundURL, "Go Playground URL")
	f.StringVar(&cfg.GoTipPlaygroundURL, "gotip-url", goplay.DefaultGoTipPlaygroundURL, "GoTip Playground URL")
	f.DurationVar(&cfg.ConnectTimeout, "timeout", 15*time.Second, "Go Playground server connect timeout")
}

type BuildConfig struct {
	BuildDir          string
	PackagesFile      string
	CleanupInterval   time.Duration
	BypassEnvVarsList []string
}

func (cfg *BuildConfig) mountFlagSet(f *flag.FlagSet) {
	f.StringVar(&cfg.PackagesFile, "f", "packages.json", "Path to packages index JSON file")
	f.StringVar(&cfg.BuildDir, "wasm-build-dir", os.TempDir(), "Directory for WASM builds")
	f.DurationVar(&cfg.CleanupInterval, "clean-interval", 10*time.Minute, "Build directory cleanup interval")
	f.Var(cmdutil.NewStringsListValue(&cfg.BypassEnvVarsList), "permit-env-vars", "Comma-separated allow list of environment variables passed to Go compiler tool")
}

type ServicesConfig struct {
	GoogleAnalyticsID string
	SentryDSN         string
}

type Config struct {
	PackagesFile string
	HTTP         HTTPConfig
	Playground   PlaygroundConfig
	Build        BuildConfig
	Log          LogConfig
}

func FromFlags(f *flag.FlagSet) *Config {
	var cfg Config
	f.StringVar(&args.addr, "addr", ":8080", "TCP Listen address")
	cfg.Playground.mountFlagSet(f)
	f.StringVar(&args.assetsDirectory, "static-dir", filepath.Join(wd, "public"), "Path to web page assets (HTML, JS, etc)")
	f.DurationVar(&args.connectTimeout, "timeout", 15*time.Second, "Go Playground server connect timeout")
	f.StringVar(&args.googleAnalyticsID, "gtag-id", "", "Google Analytics tag ID (optional)")

	return &cfg
}
