package langserver

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/x1unix/go-playground/internal/analyzer"
	"github.com/x1unix/go-playground/internal/compiler"
	"github.com/x1unix/go-playground/internal/compiler/storage"
	"github.com/x1unix/go-playground/pkg/goplay"
	"go.uber.org/zap"
	"golang.org/x/time/rate"
)

const (
	// limit for wasm compile requests per second (250ms per request)
	compileRequestsPerFrame = 4
	frameTime               = time.Second
	maxBuildTimeDuration    = time.Second * 30

	wasmMimeType           = "application/wasm"
	formatQueryParam       = "format"
	artifactParamVal       = "artifactId"
	playgroundBackendParam = "backend"
)

type BackendVersionProvider interface {
	GetVersions(ctx context.Context) (*VersionsInformation, error)
}

// Service is language server service
type Service struct {
	config          ServiceConfig
	log             *zap.SugaredLogger
	index           analyzer.PackageIndex
	compiler        compiler.BuildService
	versionProvider BackendVersionProvider

	client  *goplay.Client
	limiter *rate.Limiter
}

type ServiceConfig struct {
	Version string
}

// New is Service constructor
func New(cfg ServiceConfig, client *goplay.Client, packages []*analyzer.Package, builder compiler.BuildService) *Service {
	return &Service{
		config:          cfg,
		compiler:        builder,
		client:          client,
		log:             zap.S().Named("langserver"),
		index:           analyzer.BuildPackageIndex(packages),
		versionProvider: NewBackendVersionService(zap.L(), client, VersionCacheTTL),
		limiter:         rate.NewLimiter(rate.Every(frameTime), compileRequestsPerFrame),
	}
}

// Mount mounts service on route
func (s *Service) Mount(r *mux.Router) {
	r.Path("/version").
		HandlerFunc(WrapHandler(s.HandleGetVersion))
	r.Path("/suggest").
		HandlerFunc(WrapHandler(s.HandleGetSuggestion))
	r.Path("/run").Methods(http.MethodPost).
		HandlerFunc(WrapHandler(s.HandleRunCode, ValidateContentLength))
	r.Path("/compile").Methods(http.MethodPost).
		HandlerFunc(WrapHandler(s.HandleCompile, ValidateContentLength))
	r.Path("/format").Methods(http.MethodPost).
		HandlerFunc(WrapHandler(s.HandleFormatCode, ValidateContentLength))
	r.Path("/share").Methods(http.MethodPost).
		HandlerFunc(WrapHandler(s.HandleShare, ValidateContentLength))
	r.Path("/snippet/{id}").Methods(http.MethodGet).
		HandlerFunc(WrapHandler(s.HandleGetSnippet))
	r.Path("/backends/info").Methods(http.MethodGet).
		HandlerFunc(WrapHandler(s.HandleGetVersions))
	r.Path("/artifacts/{artifactId:[a-fA-F0-9]+}.wasm").Methods(http.MethodGet).
		HandlerFunc(WrapHandler(s.HandleArtifactRequest))
}

func (s *Service) lookupBuiltin(val string) (*SuggestionsResponse, error) {
	// Package or built-in lookup
	pkg, ok := s.index.PackageByName("builtin")
	if !ok {
		return nil, fmt.Errorf("failed to find %q package and it's weird", "builtin")
	}

	if err := pkg.Analyze(); err != nil {
		return nil, fmt.Errorf("failed to analyze builtin package: %s", err)
	}

	// Lookup in built-in functions and them package names
	resp := SuggestionsResponse{
		Suggestions: pkg.SymbolByChar(val),
	}

	resp.Suggestions = append(resp.Suggestions, s.index.Match(val)...)
	return &resp, nil
}

func (s *Service) provideSuggestion(req SuggestionRequest) (*SuggestionsResponse, error) {
	// Provide package suggestions (if requested)
	if req.PackageName != "" {
		pkg, ok := s.index.PackageByName(req.PackageName)
		if !ok {
			return nil, fmt.Errorf("package %q doesn't exists in index", req.PackageName)
		}

		if err := pkg.Analyze(); err != nil {
			return nil, fmt.Errorf("failed to analyze package %q: %s", req.PackageName, err)
		}

		var symbols []*analyzer.CompletionItem
		if req.Value != "" {
			symbols = pkg.SymbolByChar(req.Value)
		} else {
			symbols = pkg.AllSymbols()
		}

		return &SuggestionsResponse{
			Suggestions: symbols,
		}, nil
	}

	if req.Value == "" {
		return nil, fmt.Errorf("empty suggestion request value, nothing to provide")
	}

	return s.lookupBuiltin(req.Value)
}

// HandleGetVersion handles /api/version
func (s *Service) HandleGetVersion(w http.ResponseWriter, _ *http.Request) error {
	WriteJSON(w, VersionResponse{Version: s.config.Version})
	return nil
}

// HandleGetSuggestion handles code suggestion
func (s *Service) HandleGetSuggestion(w http.ResponseWriter, r *http.Request) error {
	q := r.URL.Query()
	value := q.Get("value")
	pkgName := q.Get("packageName")

	resp, err := s.provideSuggestion(SuggestionRequest{PackageName: pkgName, Value: value})
	if err != nil {
		return err
	}

	resp.Write(w)
	return nil
}

// HandleFormatCode handles goimports action
func (s *Service) HandleFormatCode(w http.ResponseWriter, r *http.Request) error {
	src, err := getPayloadFromRequest(r)
	if err != nil {
		return err
	}

	backend, err := backendFromRequest(r)
	if err != nil {
		return NewHTTPError(http.StatusBadRequest, err)
	}

	formatted, _, err := s.goImportsCode(r.Context(), src, backend)
	if err != nil {
		if goplay.IsCompileError(err) {
			return NewHTTPError(http.StatusBadRequest, err)
		}
		return err
	}

	WriteJSON(w, RunResponse{Formatted: string(formatted)})
	return nil
}

// HandleShare handles snippet share
func (s *Service) HandleShare(w http.ResponseWriter, r *http.Request) error {
	shareID, err := s.client.Share(r.Context(), r.Body)
	defer r.Body.Close()
	if err != nil {
		if errors.Is(err, goplay.ErrSnippetTooLarge) {
			return NewHTTPError(http.StatusRequestEntityTooLarge, err)
		}

		s.log.Error("failed to share code: ", err)
		return err
	}

	WriteJSON(w, ShareResponse{SnippetID: shareID})
	return nil
}

// HandleGetSnippet handles snippet load
func (s *Service) HandleGetSnippet(w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	snippetID := vars["id"]
	snippet, err := s.client.GetSnippet(r.Context(), snippetID)
	if err != nil {
		if errors.Is(err, goplay.ErrSnippetNotFound) {
			return Errorf(http.StatusNotFound, "snippet %q not found", snippetID)
		}

		s.log.Errorw("failed to get snippet",
			"snippetID", snippetID,
			"err", err,
		)
		return err
	}

	WriteJSON(w, SnippetResponse{
		FileName: snippet.FileName,
		Code:     snippet.Contents,
	})
	return nil
}

// HandleRunCode handles code run
func (s *Service) HandleRunCode(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	src, err := getPayloadFromRequest(r)
	if err != nil {
		return err
	}

	shouldFormat, err := shouldFormatCode(r)
	if err != nil {
		return err
	}

	backendName, err := backendFromRequest(r)
	if err != nil {
		return NewHTTPError(http.StatusBadRequest, err)
	}

	var changed bool
	if shouldFormat {
		src, changed, err = s.goImportsCode(ctx, src, backendName)
		if err != nil {
			if goplay.IsCompileError(err) {
				return NewHTTPError(http.StatusBadRequest, err)
			}
			s.log.Error(err)
			return err
		}
	}

	res, err := s.client.Compile(ctx, goplay.CompileRequest{
		Version: goplay.DefaultVersion,
		WithVet: false,
		Body:    src,
	}, backendName)
	if err != nil {
		return err
	}

	if err := res.HasError(); err != nil {
		return NewHTTPError(http.StatusBadRequest, err)
	}

	result := RunResponse{Events: res.Events}
	if changed {
		// Return formatted code if goimports had any effect
		result.Formatted = string(src)
	}

	s.log.Debugw("response from compiler", "res", res)
	WriteJSON(w, result)
	return nil
}

func (s *Service) HandleGetVersions(w http.ResponseWriter, r *http.Request) error {
	versions, err := s.versionProvider.GetVersions(r.Context())
	if err != nil {
		return err
	}

	WriteJSON(w, versions)
	return nil
}

// HandleArtifactRequest handles WASM build artifact request
func (s *Service) HandleArtifactRequest(w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	artifactId := storage.ArtifactID(vars[artifactParamVal])
	data, err := s.compiler.GetArtifact(artifactId)
	if err != nil {
		if err == storage.ErrNotExists {
			return Errorf(http.StatusNotFound, "artifact not found")
		}

		return err
	}

	contentLength := strconv.FormatInt(data.Size(), 10)
	w.Header().Set("Content-Type", wasmMimeType)
	w.Header().Set("Content-Length", contentLength)
	w.Header().Set(rawContentLengthHeader, contentLength)

	n, err := io.Copy(w, data)
	defer data.Close()
	if err != nil {
		s.log.Errorw("failed to send artifact",
			"artifactID", artifactId,
			"err", err,
		)
		return err
	}

	w.Header().Set("Content-Length", strconv.FormatInt(n, 10))
	return nil
}

// HandleCompile handles WASM build request
func (s *Service) HandleCompile(w http.ResponseWriter, r *http.Request) error {
	// Limit for request timeout
	ctx, cancel := context.WithDeadline(r.Context(), time.Now().Add(maxBuildTimeDuration))
	defer cancel()

	// Wait for our queue in line for compilation
	if err := s.limiter.Wait(ctx); err != nil {
		return NewHTTPError(http.StatusTooManyRequests, err)
	}

	src, err := getPayloadFromRequest(r)
	if err != nil {
		return err
	}

	shouldFormat, err := shouldFormatCode(r)
	if err != nil {
		return err
	}

	var changed bool
	if shouldFormat {
		src, changed, err = s.goImportsCode(r.Context(), src, goplay.BackendGoCurrent)
		if err != nil {
			if goplay.IsCompileError(err) {
				return NewHTTPError(http.StatusBadRequest, err)
			}
			s.log.Error(err)
			return err
		}
	}

	result, err := s.compiler.Build(ctx, src)
	if err != nil {
		switch err.(type) {
		case *compiler.BuildError:
			return NewHTTPError(http.StatusBadRequest, err)
		default:
			return err
		}
	}

	resp := BuildResponse{FileName: result.FileName}
	if changed {
		// Return formatted code if goimports had any effect
		resp.Formatted = string(src)
	}

	WriteJSON(w, resp)
	return nil
}

func backendFromRequest(r *http.Request) (goplay.Backend, error) {
	backendName := r.URL.Query().Get(playgroundBackendParam)
	if backendName == "" {
		return goplay.BackendGoCurrent, nil
	}

	if !goplay.ValidateBackend(backendName) {
		return "", fmt.Errorf("invalid backend name %q", backendName)
	}

	return backendName, nil
}

// goImportsCode reads code from request and performs "goimports" on it
// if any error occurs, it sends error response to client and closes connection
//
// if "format" url query param is undefined or set to "false", just returns code as is
func (s *Service) goImportsCode(ctx context.Context, src []byte, backend goplay.Backend) ([]byte, bool, error) {
	resp, err := s.client.GoImports(ctx, src, backend)
	if err != nil {
		if errors.Is(err, goplay.ErrSnippetTooLarge) {
			return nil, false, NewHTTPError(http.StatusRequestEntityTooLarge, err)
		}

		s.log.Error(err)
		return nil, false, err
	}

	if err = resp.HasError(); err != nil {
		return nil, false, err
	}

	changed := resp.Body != string(src)
	return []byte(resp.Body), changed, nil
}
