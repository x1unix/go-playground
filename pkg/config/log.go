package config

import (
	"flag"
	"github.com/x1unix/go-playground/pkg/util/cmdutil"
	"go.uber.org/zap"
)

type LogConfig struct {
	Debug    bool
	Level    zap.AtomicLevel
	Encoding string
}

func (cfg *LogConfig) mountFlagSet(f *flag.FlagSet) {
	f.BoolVar(&cfg.Debug, "debug", false, "Enable debug mode")
	f.StringVar(&cfg.Encoding, "log-format", "console", "Log output format (console, json)")
	f.Var(cmdutil.NewTextUnmarshalerValue(&cfg.Level), "log-level", "Log level (info, warn, error, debug)")
}
