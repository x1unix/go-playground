package server

import (
	"context"
	"errors"
	"fmt"
	"golang.org/x/time/rate"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/x1unix/go-playground/internal/builder"
	"github.com/x1unix/go-playground/pkg/goplay"
	"go.uber.org/zap"
)

var ErrEmptyRequest = errors.New("empty request")

type APIv2Handler struct {
	logger   *zap.Logger
	compiler builder.BuildService
	client   *goplay.Client
	limiter  *rate.Limiter
}

func NewAPIv2Handler(client *goplay.Client, builder builder.BuildService) *APIv2Handler {
	return &APIv2Handler{
		logger:   zap.L().Named("api.v2"),
		compiler: builder,
		client:   client,
		limiter:  rate.NewLimiter(rate.Every(frameTime), compileRequestsPerFrame),
	}
}

func (h *APIv2Handler) HandleGetSnippet(w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	snippetID := vars["id"]

	snippet, err := h.client.GetSnippet(r.Context(), snippetID)
	if err != nil {
		if errors.Is(err, goplay.ErrSnippetNotFound) {
			return Errorf(http.StatusNotFound, "snippet %q not found", snippetID)
		}

		h.logger.Error("failed to get snippet", zap.String("snippetID", snippetID), zap.Error(err))
		return err
	}

	files, err := goplay.SplitFileSet(snippet.Contents, goplay.SplitFileOpts{
		DefaultFileName: "main.go",
		CheckPaths:      false,
	})
	if err != nil {
		// Serve stuff as-is
		h.logger.Error(
			"Cannot split snippet to files",
			zap.Error(err),
			zap.String("contents", snippet.Contents),
			zap.String("snippetID", snippetID),
		)
		files = map[string]string{snippet.FileName: snippet.Contents}
	}

	WriteJSON(w, FilesPayload{Files: files})
	return nil
}

func (h *APIv2Handler) HandleShare(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	payload, _, err := fileSetFromRequest(r)
	if err != nil {
		return err
	}

	snippetID, err := h.client.Share(ctx, payload.Reader())
	if err != nil {
		return err
	}
	if err != nil {
		if isContentLengthError(err) {
			return ErrSnippetTooLarge
		}

		h.logger.Error("share error", zap.Error(err))
		return err
	}

	WriteJSON(w, ShareResponse{SnippetID: snippetID})
	return nil
}

func (h *APIv2Handler) HandleFormat(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	backend, err := backendFromQuery(r.URL.Query())
	if err != nil {
		return NewBadRequestError(err)
	}

	defer r.Body.Close()
	payload, fileNames, err := fileSetFromRequest(r)
	if err != nil {
		return err
	}

	rsp, err := h.client.GoImports(ctx, payload.Bytes(), backend)
	if err != nil {
		if isContentLengthError(err) {
			return ErrSnippetTooLarge
		}

		h.logger.Error("goimports error", zap.Error(err))
		return err
	}

	if err := rsp.HasError(); err != nil {
		return NewBadRequestError(err)
	}

	results, err := goplay.SplitFileSet(rsp.Body, goplay.SplitFileOpts{
		DefaultFileName: fileNames[0],
		CheckPaths:      true,
	})
	if err != nil {
		h.logger.Error("failed to reconstruct files set from format response", zap.Error(err), zap.String("rsp", rsp.Body))
		return NewHTTPError(http.StatusInternalServerError, fmt.Errorf("failed to reconstruct files set from format response: %w", err))
	}

	WriteJSON(w, FilesPayload{Files: results})
	return nil
}

func (h *APIv2Handler) HandleRun(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	params, err := RunParamsFromQuery(r.URL.Query())
	if err != nil {
		return NewBadRequestError(err)
	}

	snippet, err := evalPayloadFromRequest(r)
	if err != nil {
		return NewBadRequestError(err)
	}

	res, err := h.client.Evaluate(ctx, goplay.CompileRequest{
		Version: goplay.DefaultVersion,
		WithVet: params.Vet,
		Body:    snippet,
	}, params.Backend)
	if err != nil {
		return err
	}

	if err := res.HasError(); err != nil {
		return NewBadRequestError(err)
	}

	h.logger.Debug("response from compiler", zap.Any("res", res))
	WriteJSON(w, RunResponse{
		Events: res.Events,
	})

	return nil
}

func (h *APIv2Handler) HandleCompile(w http.ResponseWriter, r *http.Request) error {
	// Limit for request timeout
	ctx, cancel := context.WithDeadline(r.Context(), time.Now().Add(maxBuildTimeDuration))
	defer cancel()

	// Wait for our queue in line for compilation
	if err := h.limiter.Wait(ctx); err != nil {
		return NewHTTPError(http.StatusTooManyRequests, err)
	}

	files, err := buildFilesFromRequest(r)
	if err != nil {
		return err
	}

	result, err := h.compiler.Build(ctx, files)
	if builder.IsBuildError(err) {
		return NewHTTPError(http.StatusBadRequest, err)
	}
	if err != nil {
		return err
	}

	WriteJSON(w, BuildResponse{
		FileName: result.FileName,
	})
	return nil
}

func (h *APIv2Handler) Mount(r *mux.Router) {
	r.Path("/run").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleRun))
	r.Path("/format").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleFormat))
	r.Path("/share").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleShare))
	r.Path("/share/{id}").Methods(http.MethodGet).HandlerFunc(WrapHandler(h.HandleGetSnippet))
	r.Path("/compile").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleCompile))
}
