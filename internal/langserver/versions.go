package langserver

import (
	"context"
	_ "embed"
	"errors"
	"fmt"
	"golang.org/x/sync/errgroup"
	"runtime"
	"strings"
	"time"

	"github.com/avast/retry-go"
	"github.com/x1unix/go-playground/internal/util/syncx"
	"github.com/x1unix/go-playground/pkg/goplay"
	"go.uber.org/zap"
)

const (
	goVersionRetryAttempts = 3
	goVersionRetryDelay    = time.Second

	VersionCacheTTL = 24 * time.Hour
)

//go:embed resources/version.go.txt
var versionSnippet []byte

var backends = []goplay.Backend{
	goplay.BackendGoCurrent,
	goplay.BackendGoPrev,
	goplay.BackendGoTip,
}

var _ BackendVersionProvider = (*BackendVersionService)(nil)

// BackendVersionService provides information about used Go versions
// for all backends.
type BackendVersionService struct {
	logger      *zap.Logger
	client      *goplay.Client
	cachedValue *syncx.TTLValue[*VersionsInformation]
}

func NewBackendVersionService(logger *zap.Logger, client *goplay.Client, cacheTTL time.Duration) *BackendVersionService {
	return &BackendVersionService{
		logger:      logger,
		client:      client,
		cachedValue: syncx.NewTTLValue[*VersionsInformation](cacheTTL, nil),
	}
}

// GetVersions provides Go version information for all backends.
func (svc *BackendVersionService) GetVersions(ctx context.Context) (*VersionsInformation, error) {
	value := svc.cachedValue.Get()
	if value != nil {
		return value, nil
	}

	vers, err := svc.probeGoVersions(ctx)
	if err != nil {
		return nil, err
	}

	svc.cachedValue.Set(vers)
	return vers, nil
}

func (svc *BackendVersionService) probeGoVersions(ctx context.Context) (*VersionsInformation, error) {
	playgroundVers, err := svc.getPlaygroundVersions(ctx)
	if err != nil {
		return nil, err
	}

	hostGoVersion := normalizeGoVersion(runtime.Version())
	return &VersionsInformation{
		Playground:  playgroundVers,
		WebAssembly: hostGoVersion,
	}, nil
}

func (svc *BackendVersionService) getPlaygroundVersions(ctx context.Context) (*PlaygroundVersions, error) {
	versionInfo := &PlaygroundVersions{}
	g, gCtx := errgroup.WithContext(ctx)
	for _, backend := range backends {
		b := backend
		g.Go(func() error {
			svc.logger.Debug("Fetching go version for backend", zap.String("backend", b))
			result, err := svc.fetchGoBackendVersionWithRetry(gCtx, b)
			if err != nil {
				return fmt.Errorf("failed to get Go version from Go playground server for backend %q: %w",
					b, err)
			}

			// We don't afraid race condition because each backend is written to a separate address
			versionInfo.SetBackendVersion(b, result)
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return versionInfo, nil
}

func (svc *BackendVersionService) fetchGoBackendVersionWithRetry(ctx context.Context, backend goplay.Backend) (string, error) {
	var result string
	err := retry.Do(
		func() error {
			version, err := svc.getGoBackendVersion(ctx, backend)
			if err != nil {
				return err
			}

			result = version
			return nil
		},
		retry.Attempts(goVersionRetryAttempts),
		retry.Delay(goVersionRetryDelay),
		retry.RetryIf(func(err error) bool {
			httpErr, ok := goplay.IsHTTPError(err)
			if !ok {
				return false
			}

			// Retry only on server issues
			return httpErr.StatusCode >= 500
		}),
		retry.OnRetry(func(n uint, err error) {
			svc.logger.Error("failed to get Go version from Go playground, retrying...",
				zap.Error(err), zap.String("backend", backend), zap.Uint("attempt", n))
		}),
	)

	return result, err
}

func (svc *BackendVersionService) getGoBackendVersion(ctx context.Context, backend goplay.Backend) (string, error) {
	// Dirty hack to fetch Go version for playground backend by running a simple program
	// which returns Go version to stdout.
	result, err := svc.client.Compile(ctx, goplay.CompileRequest{
		Version: goplay.DefaultVersion,
		WithVet: false,
		Body:    versionSnippet,
	}, backend)

	if err != nil {
		return "", err
	}

	if result.Errors != "" {
		return "", fmt.Errorf("probe program returned an error: %s", result.Errors)
	}

	if len(result.Events) == 0 {
		return "", errors.New("missing output events from probe program")
	}

	version := normalizeGoVersion(result.Events[0].Message)
	return version, nil
}

func normalizeGoVersion(str string) string {
	return strings.TrimPrefix(str, "go")
}
