package server

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/x1unix/go-playground/internal/announcements"
	"github.com/x1unix/go-playground/internal/builder"
	"github.com/x1unix/go-playground/internal/builder/storage"
	"github.com/x1unix/go-playground/internal/server/backendinfo"
	"github.com/x1unix/go-playground/pkg/goplay"
	"go.uber.org/zap"
	"golang.org/x/time/rate"
)

const (
	// limit for wasm compile requests per second (250ms per request)
	compileRequestsPerFrame = 4
	frameTime               = time.Second

	wasmMimeType     = "application/wasm"
	artifactParamVal = "artifactId"
)

// APIv1Handler is API v1 handler
type APIv1Handler struct {
	config          ServiceConfig
	log             *zap.SugaredLogger
	compiler        builder.BuildService
	versionProvider backendinfo.BackendVersionProvider

	client  *goplay.Client
	limiter *rate.Limiter
}

type ServiceConfig struct {
	Version      string
	Announcement *announcements.Announcement
}

// NewAPIv1Handler is APIv1Handler constructor
func NewAPIv1Handler(cfg ServiceConfig, client *goplay.Client, builder builder.BuildService, versionProvider backendinfo.BackendVersionProvider) *APIv1Handler {
	return &APIv1Handler{
		config:          cfg,
		compiler:        builder,
		client:          client,
		log:             zap.S().Named("api.v1"),
		versionProvider: versionProvider,
		limiter:         rate.NewLimiter(rate.Every(frameTime), compileRequestsPerFrame),
	}
}

// Mount mounts service on route
func (s *APIv1Handler) Mount(r *mux.Router) {
	r.Path("/version").
		HandlerFunc(WrapHandler(s.HandleGetVersion))
	r.Path("/backends/info").Methods(http.MethodGet).
		HandlerFunc(WrapHandler(s.HandleGetVersions))
	r.Path("/announcement").Methods(http.MethodGet).
		HandlerFunc(WrapHandler(s.HandleGetAnnouncement))
	r.Path("/artifacts/{artifactId:[a-fA-F0-9]+}.wasm").Methods(http.MethodGet).
		HandlerFunc(WrapHandler(s.HandleArtifactRequest))
}

// HandleGetVersion handles /api/version
func (s *APIv1Handler) HandleGetVersion(w http.ResponseWriter, _ *http.Request) error {
	WriteJSON(w, VersionResponse{Version: s.config.Version, APIVersion: "2"})
	return nil
}

// HandleGetAnnouncement returns service announcement banner contents.
func (s *APIv1Handler) HandleGetAnnouncement(w http.ResponseWriter, r *http.Request) error {
	WriteJSON(w, GetAnnouncementResponse{Message: s.config.Announcement})
	return nil
}

func (s *APIv1Handler) HandleGetVersions(w http.ResponseWriter, r *http.Request) error {
	versions, err := s.versionProvider.GetRemoteVersions(r.Context())
	if err != nil {
		if errors.Is(err, context.Canceled) {
			return nil
		}

		return err
	}

	rsp := VersionsInformation{
		WebAssembly: s.versionProvider.ServerVersion(),
		Playground: &PlaygroundVersions{
			GoCurrent:  versions.CurrentStable,
			GoPrevious: versions.PreviousStable,
			GoTip:      versions.Nightly,
		},
	}

	WriteJSON(w, rsp)
	return nil
}

// HandleArtifactRequest handles WASM build artifact request
func (s *APIv1Handler) HandleArtifactRequest(w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	artifactId := storage.ArtifactID(vars[artifactParamVal])
	data, err := s.compiler.GetArtifact(artifactId)
	if err != nil {
		if errors.Is(err, storage.ErrNotExists) {
			return Errorf(http.StatusNotFound, "artifact not found")
		}

		return err
	}

	contentLength := strconv.FormatInt(data.Size(), 10)
	w.Header().Set("Content-Type", wasmMimeType)
	w.Header().Set("Content-Length", contentLength)
	w.Header().Set(rawContentLengthHeader, contentLength)

	defer data.Close()
	if _, err := io.Copy(w, data); err != nil {
		s.log.Errorw("failed to send artifact",
			"artifactID", artifactId,
			"err", err,
		)
		return err
	}

	return nil
}
