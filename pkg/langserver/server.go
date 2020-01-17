package langserver

import (
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/x1unix/go-playground/pkg/analyzer"
	"go.uber.org/zap"
	"net/http"
)

type Service struct {
	log   *zap.SugaredLogger
	index analyzer.PackageIndex
	upg   websocket.Upgrader
}

func New(packages []*analyzer.Package, upg websocket.Upgrader) *Service {
	return &Service{
		log:   zap.S().Named("langserver"),
		upg:   upg,
		index: analyzer.BuildPackageIndex(packages),
	}
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

func (s *Service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
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
