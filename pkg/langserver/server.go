package langserver

import (
	"context"
	"fmt"
	"github.com/x1unix/go-playground/pkg/compiler"
	"github.com/x1unix/go-playground/pkg/compiler/storage"
	"io"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/x1unix/go-playground/pkg/analyzer"
	"github.com/x1unix/go-playground/pkg/goplay"
	"go.uber.org/zap"
	"golang.org/x/time/rate"
)

const (
	// limit for wasm compile requests per second (250ms per request)
	compileRequestsPerFrame = 4
	frameTime               = time.Second
	maxBuildTimeDuration    = time.Second * 30

	wasmMimeType     = "application/wasm"
	formatQueryParam = "format"
	artifactParamVal = "artifactId"
)

type Service struct {
	log      *zap.SugaredLogger
	index    analyzer.PackageIndex
	compiler compiler.BuildService
	limiter  *rate.Limiter
}

func New(packages []*analyzer.Package, builder compiler.BuildService) *Service {
	return &Service{
		compiler: builder,
		log:      zap.S().Named("langserver"),
		index:    analyzer.BuildPackageIndex(packages),
		limiter:  rate.NewLimiter(rate.Every(frameTime), compileRequestsPerFrame),
	}
}

// Mount mounts service on route
func (s *Service) Mount(r *mux.Router) {
	r.Path("/suggest").HandlerFunc(s.HandleGetSuggestion)
	r.Path("/run").Methods(http.MethodPost).HandlerFunc(s.HandleRunCode)
	r.Path("/compile").Methods(http.MethodPost).HandlerFunc(s.HandleCompile)
	r.Path("/format").Methods(http.MethodPost).HandlerFunc(s.HandleFormatCode)
	r.Path("/share").Methods(http.MethodPost).HandlerFunc(s.HandleShare)
	r.Path("/snippet/{id}").Methods(http.MethodGet).HandlerFunc(s.HandleGetSnippet)
	r.Path("/artifacts/{artifactId:[a-fA-F0-9]+}.wasm").Methods(http.MethodGet).HandlerFunc(s.HandleArtifactRequest)
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
	if req.Value == "" {
		return nil, fmt.Errorf("empty suggestion request value, nothing to provide")
	}

	// Provide package suggestions (if requested)
	if req.PackageName != "" {
		pkg, ok := s.index.PackageByName(req.PackageName)
		if !ok {
			return nil, fmt.Errorf("package %q doesn't exists in index", req.PackageName)
		}

		if err := pkg.Analyze(); err != nil {
			return nil, fmt.Errorf("failed to analyze package %q: %s", req.PackageName, err)
		}

		return &SuggestionsResponse{
			Suggestions: pkg.SymbolByChar(req.Value),
		}, nil
	}

	return s.lookupBuiltin(req.Value)
}

func (s *Service) HandleGetSuggestion(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	value := q.Get("value")
	pkgName := q.Get("packageName")

	resp, err := s.provideSuggestion(SuggestionRequest{PackageName: pkgName, Value: value})
	if err != nil {
		NewErrorResponse(err).Write(w)
		return
	}

	resp.Write(w)
}

// goImportsCode reads code from request and performs "goimports" on it
// if any error occurs, it sends error response to client and closes connection
//
// if "format" url query param is undefined or set to "false", just returns code as is
func (s *Service) goImportsCode(w http.ResponseWriter, r *http.Request) ([]byte, error, bool) {
	if err := goplay.ValidateContentLength(int(r.ContentLength)); err != nil {
		Errorf(http.StatusRequestEntityTooLarge, err.Error()).Write(w)
		return nil, err, false
	}

	shouldFormatCode, err := strconv.ParseBool(r.URL.Query().Get(formatQueryParam))
	if err != nil {
		Errorf(
			http.StatusBadRequest,
			"invalid %q query parameter value (expected boolean)",
			formatQueryParam,
		).Write(w)
		return nil, err, false
	}

	src, err := ioutil.ReadAll(r.Body)
	if err != nil {
		Errorf(http.StatusBadGateway, "failed to read request: %s", err).Write(w)
		return nil, err, false
	}

	if !shouldFormatCode {
		// return code as is if don't need to format code
		return src, nil, false
	}

	defer r.Body.Close()
	resp, err := goplay.GoImports(r.Context(), src)
	if err != nil {
		if err == goplay.ErrSnippetTooLarge {
			Errorf(http.StatusRequestEntityTooLarge, err.Error()).Write(w)
			return nil, err, false
		}

		NewErrorResponse(err).Write(w)
		return nil, err, false
	}

	if err = resp.HasError(); err != nil {
		Errorf(http.StatusBadRequest, err.Error()).Write(w)
		return nil, err, false
	}

	changed := resp.Body != string(src)
	return []byte(resp.Body), nil, changed
}

func (s *Service) HandleFormatCode(w http.ResponseWriter, r *http.Request) {
	code, err, _ := s.goImportsCode(w, r)
	if err != nil {
		if goplay.IsCompileError(err) {
			return
		}

		s.log.Error(err)
		return
	}

	WriteJSON(w, RunResponse{Formatted: string(code)})
}

func (s *Service) HandleShare(w http.ResponseWriter, r *http.Request) {
	shareID, err := goplay.Share(r.Context(), r.Body)
	defer r.Body.Close()
	if err != nil {
		if err == goplay.ErrSnippetTooLarge {
			Errorf(http.StatusRequestEntityTooLarge, err.Error()).Write(w)
			return
		}

		s.log.Error("failed to share code: ", err)
		NewErrorResponse(err).Write(w)
	}

	WriteJSON(w, ShareResponse{SnippetID: shareID})
}

func (s *Service) HandleGetSnippet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	snippetID := vars["id"]
	snippet, err := goplay.GetSnippet(r.Context(), snippetID)
	if err != nil {
		if err == goplay.ErrSnippetNotFound {
			Errorf(http.StatusNotFound, "snippet %q not found", snippetID).Write(w)
			return
		}

		s.log.Errorw("failed to get snippet",
			"snippetID", snippetID,
			"err", err,
		)
		NewErrorResponse(err).Write(w)
		return
	}

	WriteJSON(w, SnippetResponse{
		FileName: snippet.FileName,
		Code:     snippet.Contents,
	})
}

func (s *Service) HandleRunCode(w http.ResponseWriter, r *http.Request) {
	src, err, changed := s.goImportsCode(w, r)
	if err != nil {
		if goplay.IsCompileError(err) {
			return
		}

		s.log.Error(err)
		return
	}

	res, err := goplay.Compile(r.Context(), src)
	if err != nil {
		NewErrorResponse(err).Write(w)
		return
	}

	if err := res.HasError(); err != nil {
		Errorf(http.StatusBadRequest, err.Error()).Write(w)
		return
	}

	result := RunResponse{Events: res.Events}
	if changed {
		// Return formatted code if goimports had any effect
		result.Formatted = string(src)
	}

	s.log.Debugw("response from compiler", "res", res)
	WriteJSON(w, result)
}

func (s *Service) HandleArtifactRequest(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	artifactId := storage.ArtifactID(vars[artifactParamVal])
	data, err := s.compiler.GetArtifact(artifactId)
	if err != nil {
		if err == storage.ErrNotExists {
			Errorf(http.StatusNotFound, "artifact not found").Write(w)
			return
		}

		NewErrorResponse(err).Write(w)
		return
	}

	n, err := io.Copy(w, data)
	defer data.Close()
	if err != nil {
		s.log.Errorw("failed to send artifact",
			"artifactID", artifactId,
			"err", err,
		)
		NewErrorResponse(err).Write(w)
		return
	}

	w.Header().Set("Content-Type", wasmMimeType)
	w.Header().Set("Content-Length", strconv.FormatInt(n, 10))
}

func (s *Service) HandleCompile(w http.ResponseWriter, r *http.Request) {
	// Limit for request timeout
	ctx, _ := context.WithDeadline(r.Context(), time.Now().Add(maxBuildTimeDuration))

	// Wait for our queue in line for compilation
	if err := s.limiter.Wait(ctx); err != nil {
		Errorf(http.StatusTooManyRequests, err.Error()).Write(w)
		return
	}

	src, err, changed := s.goImportsCode(w, r)
	if err != nil {
		if goplay.IsCompileError(err) {
			return
		}

		s.log.Error(err)
		return
	}

	result, err := s.compiler.Build(ctx, src)
	if err != nil {
		if compileErr, ok := err.(*compiler.BuildError); ok {
			Errorf(http.StatusBadRequest, compileErr.Error()).Write(w)
			return
		}

		Errorf(http.StatusBadRequest, err.Error()).Write(w)
		return
	}

	resp := BuildResponse{FileName: result.FileName}
	if changed {
		// Return formatted code if goimports had any effect
		resp.Formatted = string(src)
	}

	WriteJSON(w, resp)
}
