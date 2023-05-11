package compiler

import (
	"bytes"
	"context"
	"os"

	"github.com/x1unix/go-playground/internal/compiler/storage"
	"github.com/x1unix/go-playground/pkg/util/osutil"
	"go.uber.org/zap"
)

// predefinedBuildVars is list of environment vars which contain build values
var predefinedBuildVars = osutil.EnvironmentVariables{
	"CGO_ENABLED": "0",
	"GOOS":        "js",
	"GOARCH":      "wasm",
	"HOME":        os.Getenv("HOME"),
}

// Result is WASM build result
type Result struct {
	// FileName is artifact file name
	FileName string
}

// BuildEnvironmentConfig is BuildService environment configuration.
type BuildEnvironmentConfig struct {
	// IncludedEnvironmentVariables is a list included environment variables for build.
	IncludedEnvironmentVariables osutil.EnvironmentVariables
}

// BuildService is WASM build service
type BuildService struct {
	log     *zap.SugaredLogger
	config  BuildEnvironmentConfig
	storage storage.StoreProvider
}

// NewBuildService is BuildService constructor
func NewBuildService(log *zap.SugaredLogger, cfg BuildEnvironmentConfig, store storage.StoreProvider) BuildService {
	return BuildService{
		log:     log.Named("builder"),
		config:  cfg,
		storage: store,
	}
}

func (s BuildService) buildSource(ctx context.Context, outputLocation, sourceLocation string) error {
	cmd := newGoToolCommand(ctx, "build", "-o", outputLocation, sourceLocation)
	cmd.Env = s.getEnvironmentVariables()
	buff := &bytes.Buffer{}
	cmd.Stderr = buff

	s.log.Debugw("starting go build", "command", cmd.Args, "env", cmd.Env)
	if err := cmd.Start(); err != nil {
		return err
	}

	if err := cmd.Wait(); err != nil {
		errMsg := buff.String()
		s.log.Debugw("build failed", "err", err, "stderr", errMsg)
		return newBuildError(errMsg)
	}

	return nil
}

func (s BuildService) getEnvironmentVariables() []string {
	if len(s.config.IncludedEnvironmentVariables) == 0 {
		return predefinedBuildVars.Join()
	}

	return s.config.IncludedEnvironmentVariables.Concat(predefinedBuildVars).Join()
}

// GetArtifact returns artifact by id
func (s BuildService) GetArtifact(id storage.ArtifactID) (storage.ReadCloseSizer, error) {
	return s.storage.GetItem(id)
}

// Build compiles Go source to WASM and returns result
func (s BuildService) Build(ctx context.Context, data []byte) (*Result, error) {
	aid, err := storage.GetArtifactID(data)
	if err != nil {
		return nil, err
	}

	result := &Result{FileName: aid.Ext(storage.ExtWasm)}
	isCached, err := s.storage.HasItem(aid)
	if err != nil {
		s.log.Errorw("failed to check cache", "artifact", aid.String(), "err", err)
		return nil, err
	}

	if isCached {
		// Just return precompiled result if data is cached already
		s.log.Debugw("build cached, returning cached file", "artifact", aid.String())
		return result, nil
	}

	err = s.storage.CreateLocationAndDo(aid, data, func(wasmLocation, sourceLocation string) error {
		return s.buildSource(ctx, wasmLocation, sourceLocation)
	})

	return result, err
}
