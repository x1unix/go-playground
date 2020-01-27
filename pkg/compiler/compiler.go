package compiler

import (
	"bytes"
	"context"
	"github.com/pkg/errors"
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

type Result struct {
	FileName string
	Data     io.ReadCloser
}

type BuildService struct {
	log     *zap.SugaredLogger
	storage storage.StoreProvider
}

func NewBuildService(log *zap.SugaredLogger, store storage.StoreProvider) BuildService {
	return BuildService{
		log:     log.Named("builder"),
		storage: store,
	}
}

func (s BuildService) buildSource(ctx context.Context, outputLocation, sourceLocation string) (io.ReadCloser, error) {
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
		return nil, err
	}

	if err := cmd.Wait(); err != nil {
		errMsg := buff.String()
		s.log.Debugw("build failed", "err", err, "stderr", errMsg)
		return nil, newBuildError(errMsg)
		//return nil, newBuildError(errPipe, err)
	}

	// build finishes, now let's get the wasm file
	f, err := os.Open(outputLocation)
	if err != nil {
		return nil, errors.Wrap(err, "failed to open compiled WASM file")
	}

	return f, nil
}

func (s BuildService) Build(ctx context.Context, data []byte) (*Result, error) {
	aid, err := storage.GetArtifactID(data)
	if err != nil {
		return nil, err
	}

	result := &Result{FileName: aid.Ext(storage.ExtWasm)}
	compiled, err := s.storage.GetItem(aid)
	if err == nil {
		// Just return precompiled result if data is cached already
		s.log.Debugw("build cached, returning cached data", "artifact", aid.String())
		result.Data = compiled
		return result, nil
	}

	if err != storage.ErrNotExists {
		s.log.Errorw("failed to open cached file", "artifact", aid.String(), "err", err)
	}

	_ = s.storage.CreateLocationAndDo(aid, data, func(wasmLocation, sourceLocation string) error {
		result.Data, err = s.buildSource(ctx, wasmLocation, sourceLocation)
		return nil
	})

	return result, err
}
