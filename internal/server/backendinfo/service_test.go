package backendinfo

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/goplay"
	"github.com/x1unix/go-playground/pkg/testutil"
)

func TestBackendVersionService_ServerVersion(t *testing.T) {
	want := strings.TrimPrefix(runtime.Version(), "go")

	svc := NewBackendVersionService(nil, nil, ServiceConfig{})
	got := svc.ServerVersion()
	require.Equal(t, got, want)
}

func TestBackendVersionService_GetRemoteVersions(t *testing.T) {
	cases := map[string]struct{
		constructor func(t *testing.T, expect BackendVersions) *BackendVersionService
		onPostRun func(t *testing.T, svc *BackendVersionService, expect BackendVersions)
		expect BackendVersions
		expectErr string
	}{
		"should use ram cache": {
			expect: BackendVersions{
				CurrentStable:  "1.23",
				PreviousStable: "1.22",
				Nightly:        "test",
			},
			constructor: func(t *testing.T, expect BackendVersions) *BackendVersionService {
				svc := NewBackendVersionService(nil, nil, ServiceConfig{TTL: DefaultVersionCacheTTL})
				svc.memCache = &cacheEntry{
					Version:   cacheFileVersion,
					CreatedAt: time.Now(),
					Data:      expect,
				}
				return svc
			},
		},
		"should fallback to filesystem cache": {
			expect: BackendVersions{
				CurrentStable:  "1",
				PreviousStable: "2",
				Nightly:        "test",
			},
			constructor: func(t *testing.T, expect BackendVersions) *BackendVersionService {
				fname := writeTestJson(t, "cache.json", cacheEntry{
					CreatedAt: time.Now(),
					Version: cacheFileVersion,
					Data: expect,
				})
				svc := NewBackendVersionService(nil, nil, ServiceConfig{
					TTL: DefaultVersionCacheTTL,
					CacheFile: fname,
				})
			
				return svc
			},
		},
		"should fetch data if not cached": {
			expect: BackendVersions{
				CurrentStable:  "1",
				PreviousStable: "2",
				Nightly:        "test",
			},
			constructor: func(t *testing.T, expect BackendVersions) *BackendVersionService {
				fname := filepath.Join(t.TempDir(), "test", "store.json")
				srv := setupTestServer(expect)
				logger := testutil.GetLogger(t).Desugar()
				c := goplay.NewClient(srv.URL, "", 5 * time.Second)

				svc := NewBackendVersionService(logger, c, ServiceConfig{
					TTL: DefaultVersionCacheTTL,
					CacheFile: fname,
				})
				
				return svc
			},
			onPostRun: func(t *testing.T, svc *BackendVersionService, expect BackendVersions) {
				f, err := os.Open(svc.cfg.CacheFile)
				require.NoError(t, err)
				defer f.Close()

				dst := &cacheEntry{}
				err = json.NewDecoder(f).Decode(dst)
				require.Equal(t, expect, dst.Data)
			},
		},
		"should fetch data on cache miss": {
			expect: BackendVersions{
				CurrentStable:  "1",
				PreviousStable: "2",
				Nightly:        "test",
			},
			constructor: func(t *testing.T, expect BackendVersions) *BackendVersionService {
				fname := writeTestJson(t, "cache.json", cacheEntry{
					CreatedAt: time.Now().Add(-30 * time.Hour),
					Version: cacheFileVersion,
				})

				srv := setupTestServer(expect)
				logger := testutil.GetLogger(t).Desugar()
				c := goplay.NewClient(srv.URL, "", 5 * time.Second)

				svc := NewBackendVersionService(logger, c, ServiceConfig{
					TTL: time.Hour,
					CacheFile: fname,
				})
				
				return svc
			},
			onPostRun: func(t *testing.T, svc *BackendVersionService, expect BackendVersions) {
				f, err := os.Open(svc.cfg.CacheFile)
				require.NoError(t, err)
				defer f.Close()

				dst := &cacheEntry{}
				err = json.NewDecoder(f).Decode(dst)
				require.Equal(t, expect, dst.Data)
			},
		},
		"should prefill fallbacks if one on backends is down": {
			expect: BackendVersions{
				CurrentStable:  "1.23.1",
				PreviousStable: "1.22.0",
				Nightly:        "devel",
			},
			constructor: func(t *testing.T, expect BackendVersions) *BackendVersionService {
				srv := setupTestServer(BackendVersions{
					CurrentStable: expect.CurrentStable,
				})

				logger := testutil.GetLogger(t).Desugar()
				c := goplay.NewClient(srv.URL, "", 5 * time.Second)

				svc := NewBackendVersionService(logger, c, ServiceConfig{
					TTL: time.Hour,
				})
				
				return svc
			},
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			if c.constructor == nil {
				t.Fatal("missing constructor")
			}

			svc := c.constructor(t, c.expect)
			got, err := svc.GetRemoteVersions(context.TODO())
			if c.expectErr != "" {
				require.Error(t, err)
				require.EqualError(t, err, c.expectErr)
				return
			}
			
			require.NoError(t, err)
			require.NotNil(t, got)
			require.Equal(t, *got, c.expect)
		})
	}
}

func writeTestJson(t *testing.T, name string, data any) string {
	fname := filepath.Join(t.TempDir(), name)
	f, err := os.OpenFile(fname, os.O_RDWR | os.O_CREATE | os.O_TRUNC, 0644)	
	require.NoError(t, err, "can't create test file")

	err = json.NewEncoder(f).Encode(data)
	_ = f.Close()

	require.NoError(t, err, "can't wrote to a test file")
	return fname
}

func setupTestServer(expects BackendVersions) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var msg string
		switch r.URL.Query().Get("backend") {
		case goplay.BackendGoPrev:
			msg = expects.PreviousStable
		case goplay.BackendGoTip:
			msg = expects.Nightly
		case goplay.BackendGoCurrent:
			msg = expects.CurrentStable
		}

		// Simulate prod down if empty
		if msg == "" {
			w.WriteHeader(http.StatusBadGateway)
			return
		}

		rsp := goplay.CompileResponse{
			Events: []*goplay.CompileEvent{
				{
					Kind: "stdout",
					Message: msg,
				},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(rsp)
	}))
}

