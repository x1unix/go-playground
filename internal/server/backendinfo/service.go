package backendinfo

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/avast/retry-go"
	"github.com/x1unix/go-playground/pkg/goplay"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

const (
	goVersionRetryAttempts = 3
	goVersionRetryDelay    = time.Second

	DefaultVersionCacheTTL = 48 * time.Hour
)

//go:embed resources/version.go.txt
var versionSnippet []byte

const cacheFileVersion = 1

var _ BackendVersionProvider = (*BackendVersionService)(nil)

type ServiceConfig struct {
	// Version is cache file version
	Version int

	// CacheFile is name of a file which will be used to cache Go playground versions.
	CacheFile string

	// TTL is expiration interval.
	TTL time.Duration
}

type cacheEntry struct {
	Version   int
	CreatedAt time.Time
	Data      BackendVersions
}

// BackendVersionService provides information about used Go versions
// for all backends.
type BackendVersionService struct {
	logger *zap.Logger
	client *goplay.Client
	cfg    ServiceConfig

	memCache *cacheEntry
}

func NewBackendVersionService(logger *zap.Logger, client *goplay.Client, cfg ServiceConfig) *BackendVersionService {
	return &BackendVersionService{
		logger: logger,
		client: client,
		cfg:    cfg,
	}
}

func (svc *BackendVersionService) ServerVersion() string {
	return normalizeGoVersion(runtime.Version())
}

func (svc *BackendVersionService) visitCache() (*cacheEntry, error) {
	if svc.memCache != nil {
		return svc.memCache, nil
	}

	if svc.cfg.CacheFile == "" {
		return nil, fs.ErrNotExist
	}

	f, err := os.Open(svc.cfg.CacheFile)
	if err != nil {
		return nil, err
	}

	defer f.Close()
	dst := &cacheEntry{}
	err = json.NewDecoder(f).Decode(dst)

	return dst, err
}

// GetVersions provides Go version information for all backends.
func (svc *BackendVersionService) GetRemoteVersions(ctx context.Context) (*BackendVersions, error) {
	cached, err := svc.visitCache()
	if err != nil {
		if !errors.Is(err, fs.ErrNotExist) {
			svc.logger.Error("failed to check Go versions cache", zap.Error(err))
		}

		return svc.populateVersionCache(ctx)
	}

	if cached.Version != cacheFileVersion {
		return nil, fs.ErrNotExist
	}

	dt := time.Now().UTC().Sub(cached.CreatedAt.UTC())
	if dt >= svc.cfg.TTL {
		return svc.populateVersionCache(ctx)
	}

	return &cached.Data, nil
}

func (svc *BackendVersionService) populateVersionCache(ctx context.Context) (*BackendVersions, error) {
	versions, err := svc.pullBackendVersions(ctx)
	if err != nil {
		return nil, err
	}

	if err := svc.cacheVersions(versions); err != nil {
		svc.logger.Error("failed to cache Go versions", zap.Error(err))
	}

	return versions, nil
}

func (svc *BackendVersionService) cacheVersions(versions *BackendVersions) error {
	svc.memCache = &cacheEntry{
		Version:   cacheFileVersion,
		CreatedAt: time.Now().UTC(),
		Data:      *versions,
	}

	if svc.cfg.CacheFile == "" {
		return nil
	}

	err := os.MkdirAll(filepath.Dir(svc.cfg.CacheFile), 0755)
	if err != nil {
		return fmt.Errorf("MkdirAll failed: %w", err)
	}

	f, err := os.OpenFile(svc.cfg.CacheFile, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}

	defer f.Close()
	return json.NewEncoder(f).Encode(svc.memCache)
}

func (svc *BackendVersionService) pullBackendVersions(ctx context.Context) (*BackendVersions, error) {
	versionInfo := &BackendVersions{}
	g, gCtx := errgroup.WithContext(ctx)

	mapping := [3]struct {
		backend string
		dst     *string
	}{
		{
			backend: goplay.BackendGoCurrent,
			dst:     &versionInfo.CurrentStable,
		},
		{
			backend: goplay.BackendGoPrev,
			dst:     &versionInfo.PreviousStable,
		},
		{
			backend: goplay.BackendGoTip,
			dst:     &versionInfo.Nightly,
		},
	}

	for _, e := range mapping {
		b := e
		g.Go(func() error {
			svc.logger.Debug("Fetching go version for backend", zap.String("backend", e.backend))
			result, err := svc.fetchGoBackendVersionWithRetry(gCtx, e.backend)
			if err != nil {
				// Playground "gotip" and "goprev" backends are often broken
				// and I'm getting tired of seeing 5xx responses if just one of them is dead.
				//
				// Throw only if stable version is down. For others - try to figure out fallback values.
				if e.backend == goplay.BackendGoCurrent {
					return fmt.Errorf("failed to get Go version from Go playground server for backend %q: %w",
						b.backend, err)
				}

				svc.logger.Warn(
					"can't fetch Go version for backend, will use fallback",
					zap.String("backend", e.backend), zap.Error(err),
				)
				return nil
			}

			// We don't afraid race condition because each backend is written to a separate address
			*b.dst = result
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	prefillFallbacks(versionInfo)
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
	result, err := svc.client.Evaluate(ctx, goplay.CompileRequest{
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
