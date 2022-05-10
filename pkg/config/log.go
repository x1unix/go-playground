package config

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/TheZeroSlave/zapsentry"
	"github.com/x1unix/go-playground/pkg/util/cmdutil"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type SentryConfig struct {
	DSN             string        `envconfig:"SENTRY_DSN" json:"dsn"`
	UseBreadcrumbs  bool          `envconfig:"SENTRY_USE_BREADCRUMBS" json:"useBreadcrumbs"`
	BreadcrumbLevel zapcore.Level `envconfig:"SENTRY_BREADCRUMB_LEVEL" json:"breadcrumbLevel"`
}

type LogConfig struct {
	Debug  bool          `envconfig:"APP_DEBUG" json:"debug"`
	Level  zapcore.Level `envconfig:"APP_LOG_LEVEL" json:"level"`
	Format string        `envconfig:"APP_LOG_FORMAT" json:"format"`

	Sentry SentryConfig `json:"sentry"`
}

func (cfg *LogConfig) mountFlagSet(f *flag.FlagSet) {
	f.BoolVar(&cfg.Debug, "debug", false, "Enable debug mode")
	f.StringVar(&cfg.Format, "log-format", "console", "Log output format (console, json)")
	f.Var(cmdutil.NewTextUnmarshalerValue(&cfg.Level).WithDefaults("info"),
		"log-level", "Log level (info, warn, error, debug)")
	f.StringVar(&cfg.Sentry.DSN, "sentry-dsn", "", "Sentry DSN string (optional)")
	f.BoolVar(&cfg.Sentry.UseBreadcrumbs, "sentry-breadcrumbs", false, "Enable breadcrumbs for Sentry")
}

// ZapLogger constructs a new zap.Logger instance from configuration.
func (cfg LogConfig) ZapLogger() (*zap.Logger, error) {
	logCfg := zap.NewProductionConfig()
	logCfg.Development = cfg.Debug
	logCfg.Level = zap.NewAtomicLevelAt(cfg.Level)
	logCfg.Encoding = cfg.Format

	switch cfg.Format {
	case "", "json":
		logCfg.EncoderConfig = zap.NewProductionEncoderConfig()
	case "console":
		logCfg.EncoderConfig = zap.NewDevelopmentEncoderConfig()
	default:
		return nil, fmt.Errorf("unsupported log format %q", cfg.Format)
	}

	log, err := logCfg.Build()
	if err != nil {
		return nil, err
	}

	dsn := strings.TrimSpace(cfg.getSentryDsn())
	if dsn == "" {
		// Return plain logger if sentry is disabled.
		log.Debug("Sentry log is disabled")
		return log, nil
	}

	sentryCfg := zapsentry.Configuration{
		Level:             zapcore.ErrorLevel, //when to send message to sentry
		EnableBreadcrumbs: true,               // enable sending breadcrumbs to Sentry
		BreadcrumbLevel:   zapcore.InfoLevel,  // at what level should we sent breadcrumbs to sentry
		Tags: map[string]string{
			"component": "system",
		},
	}

	core, err := zapsentry.NewCore(sentryCfg, zapsentry.NewSentryClientFromDSN(dsn))
	if err != nil {
		log.Error("failed to init Sentry", zap.Error(err))
		return log, nil
	}

	log.Debug("Sentry initialized", zap.String("sentry_dsn", dsn))
	if cfg.Sentry.UseBreadcrumbs {
		log = log.With(zapsentry.NewScope())
	}

	return zapsentry.AttachCoreToLogger(core, log), nil
}

func (cfg LogConfig) getSentryDsn() string {
	if cfg.Sentry.DSN != "" {
		return cfg.Sentry.DSN
	}

	return os.Getenv("SENTRY_DSN")
}
