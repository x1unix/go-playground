package builder

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"syscall"
	"time"

	"go.uber.org/zap"

	"github.com/x1unix/go-playground/internal/builder/storage"
	"github.com/x1unix/go-playground/pkg/util/osutil"
)

// defaultGoModName is default module name that will be set if no go.mod provided.
const defaultGoModName = "app"

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

	// CompilerOutput is stderr output produced by the compiler.
	CompilerOutput string

	// IsTest indicates whether binary is a test file
	IsTest bool

	// HasBenchmark indicates whether test contains benchmarks.
	HasBenchmark bool

	// HasFuzz indicates whether test has fuzzing tests.
	HasFuzz bool
}

// BuildEnvironmentConfig is BuildService environment configuration.
type BuildEnvironmentConfig struct {
	// IncludedEnvironmentVariables is a list included environment variables for build.
	IncludedEnvironmentVariables osutil.EnvironmentVariables

	// KeepGoModCache disables Go modules cache cleanup.
	KeepGoModCache bool
}

// BuildService is WASM build service
type BuildService struct {
	log       *zap.Logger
	config    BuildEnvironmentConfig
	storage   storage.StoreProvider
	cmdRunner CommandRunner
}

// NewBuildService is BuildService constructor
func NewBuildService(log *zap.Logger, cfg BuildEnvironmentConfig, store storage.StoreProvider) BuildService {
	return BuildService{
		log:       log.Named("builder"),
		config:    cfg,
		storage:   store,
		cmdRunner: OSCommandRunner{},
	}
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
func (s BuildService) Build(ctx context.Context, files map[string][]byte, opts BuildOptions) (*Result, error) {
	projInfo, err := detectProjectType(files)
	if err != nil {
		return nil, err
	}

	// Go module is required to build project
	if _, ok := files["go.mod"]; !ok {
		files["go.mod"] = generateGoMod(defaultGoModName)
	}

	aid, err := storage.GetArtifactID(files, opts.CompilerOptions...)
	if err != nil {
		return nil, err
	}

	result := &Result{
		FileName:     aid.Ext(storage.ExtWasm),
		IsTest:       projInfo.projectType == projectTypeTest,
		HasBenchmark: projInfo.hasBenchmark,
		HasFuzz:      projInfo.hasFuzz,
	}

	compilerOutput, isCached, err := s.storage.GetCachedArtifact(aid)
	if err != nil {
		s.log.Error("failed to check cache", zap.Stringer("artifact", aid), zap.Error(err))
		return nil, err
	}

	if isCached {
		if compilerOutput == "" && len(opts.CompilerOptions) > 0 {
			s.log.Debug("cached artifact missing compiler output sidecar, rebuilding", zap.Stringer("artifact", aid))
		} else {
			result.CompilerOutput = compilerOutput
			s.log.Debug("build cached, returning cached file", zap.Stringer("artifact", aid))
			return result, nil
		}
	}

	workspace, err := s.storage.CreateWorkspace(aid, files)
	if err != nil {
		if errors.Is(err, syscall.ENOSPC) {
			// Immediately schedule cleanup job!
			s.handleNoSpaceLeft()
		}
		return nil, err
	}

	result.CompilerOutput, err = s.buildSource(ctx, projInfo, workspace, opts)
	if err != nil {
		return result, err
	}

	if err := s.storage.SetCompilerOutput(aid, result.CompilerOutput); err != nil {
		s.log.Error("failed to store compiler output", zap.Stringer("artifact", aid), zap.Error(err))
		return nil, err
	}

	return result, err
}

func (s BuildService) buildSource(ctx context.Context, projInfo projectInfo, workspace *storage.Workspace, opts BuildOptions) (string, error) {
	// Populate go.mod and go.sum files.
	if _, err := s.runGoTool(ctx, workspace.WorkDir, "mod", "tidy"); err != nil {
		return "", err
	}

	if projInfo.projectType == projectTypeProgram {
		args := []string{"build"}
		args = append(args, opts.CompilerOptions...)
		args = append(args, "-o", workspace.BinaryPath, ".")
		return s.runGoTool(ctx, workspace.WorkDir, args...)
	}

	args := []string{"test"}
	if projInfo.hasBenchmark {
		args = append(args, "-bench=.")
	}
	if projInfo.hasFuzz {
		args = append(args, "-fuzz=.")
	}

	args = append(args, opts.CompilerOptions...)
	args = append(args, "-c", "-o", workspace.BinaryPath)
	return s.runGoTool(ctx, workspace.WorkDir, args...)
}


func (s BuildService) handleNoSpaceLeft() {
	s.log.Warn("no space left on device, immediate clean triggered!")
	ctx, cancelFn := context.WithTimeout(context.Background(), time.Minute)
	defer cancelFn()

	if err := s.storage.Clean(ctx); err != nil {
		s.log.Error("failed to clear storage", zap.Error(err))
	}
	if err := s.Clean(ctx); err != nil {
		s.log.Error("failed to clear Go cache", zap.Error(err))
	}
}

func (s BuildService) runGoTool(ctx context.Context, workDir string, args ...string) (string, error) {
	cmd := newGoToolCommand(ctx, args...)
	cmd.Dir = workDir
	cmd.Env = s.getEnvironmentVariables()
	buff := &bytes.Buffer{}
	cmd.Stderr = buff

	if err := s.cmdRunner.RunCommand(cmd); err != nil {
		s.log.Debug(
			"build failed",
			zap.Error(err), zap.Strings("cmd", cmd.Args), zap.Stringer("stderr", buff),
		)

		return "", formatBuildError(ctx, err, buff)
	}

	return buff.String(), nil
}

// CleanJobName implements' builder.Cleaner interface.
func (s BuildService) CleanJobName() string {
	return "gocache"
}

// Clean implements' builder.Cleaner interface.
//
// Cleans go build and modules cache.
func (s BuildService) Clean(ctx context.Context) error {
	if s.config.KeepGoModCache {
		s.log.Info("go mod cache cleanup is disabled, skip")
		return nil
	}

	cmd := newGoToolCommand(ctx, "clean", "-modcache", "-cache", "-testcache", "-fuzzcache")
	cmd.Env = s.getEnvironmentVariables()
	buff := &bytes.Buffer{}
	cmd.Stderr = buff

	if err := s.cmdRunner.RunCommand(cmd); err != nil {
		return fmt.Errorf("process returned error: %s. Stderr: %s", err, buff.String())
	}

	return nil
}
