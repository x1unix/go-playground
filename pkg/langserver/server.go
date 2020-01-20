package langserver

import (
	"fmt"
	"github.com/gorilla/mux"
	"github.com/x1unix/go-playground/pkg/analyzer"
	"github.com/x1unix/go-playground/pkg/goplay"
	"go.uber.org/zap"
	"io/ioutil"
	"net/http"
)

type Service struct {
	log   *zap.SugaredLogger
	index analyzer.PackageIndex
}

func New(packages []*analyzer.Package) *Service {
	return &Service{
		log:   zap.S().Named("langserver"),
		index: analyzer.BuildPackageIndex(packages),
	}
}

// Mount mounts service on route
func (s *Service) Mount(r *mux.Router) {
	r.Path("/suggest").HandlerFunc(s.GetSuggestion)
	r.Path("/compile").Methods(http.MethodPost).HandlerFunc(s.Compile)
	r.Path("/format").Methods(http.MethodPost).HandlerFunc(s.FormatCode)
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

func (s *Service) GetSuggestion(w http.ResponseWriter, r *http.Request) {
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

func (s *Service) goImportsCode(w http.ResponseWriter, r *http.Request) ([]byte, error, bool) {
	src, err := ioutil.ReadAll(r.Body)
	if err != nil {
		Errorf(http.StatusBadGateway, "failed to read request: %s", err).Write(w)
		return nil, err, false
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

func (s *Service) FormatCode(w http.ResponseWriter, r *http.Request) {
	code, err, _ := s.goImportsCode(w, r)
	if err != nil {
		if goplay.IsCompileError(err) {
			return
		}

		s.log.Error(err)
		return
	}

	WriteJSON(w, CompilerResponse{Formatted: string(code)})
}

func (s *Service) Compile(w http.ResponseWriter, r *http.Request) {
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

	result := CompilerResponse{Events: res.Events}
	if changed {
		// Return formatted code if goimports had any effect
		result.Formatted = string(src)
	}

	s.log.Debugw("resp from compiler", "res", res)
	WriteJSON(w, result)
}
