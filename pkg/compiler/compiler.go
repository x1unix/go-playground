package compiler

import (
	"bytes"
	"context"
	"github.com/x1unix/go-playground/pkg/compiler/storage"
	"go.uber.org/zap"
	"io"
	"os"
	"os/exec"
)

var buildArgs = []string{
	"CGO_ENABLED=0",
	"GOOS=js",
	"GOARCH=wasm",
	"HOME=" + os.Getenv("HOME"),
}

// Result is WASM build result
type Result struct {
	// FileName is artifact file name
	FileName string
}

// BuildService is WASM build service
type BuildService struct {
	log     *zap.SugaredLogger
	storage storage.StoreProvider
}

// NewBuildService is BuildService constructor
func NewBuildService(log *zap.SugaredLogger, store storage.StoreProvider) BuildService {
	return BuildService{
		log:     log.Named("builder"),
		storage: store,
	}
}

func (s BuildService) buildSource(ctx context.Context, outputLocation, sourceLocation string) error {
	cmd := exec.CommandContext(ctx, "go",
		"build",
		"-o",
		outputLocation,
		sourceLocation,
	)

	cmd.Env = buildArgs
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

// GetArtifact returns artifact by id
func (s BuildService) GetArtifact(id storage.ArtifactID) (io.ReadCloser, error) {
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
