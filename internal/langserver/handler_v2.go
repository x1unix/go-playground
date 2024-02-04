package langserver

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/x1unix/go-playground/internal/compiler"
	"github.com/x1unix/go-playground/pkg/goplay"
	"go.uber.org/zap"
)

var ErrEmptyRequest = errors.New("empty request")

type APIv2Handler struct {
	logger   *zap.Logger
	compiler compiler.BuildService
	client   *goplay.Client
}

func NewAPIv2Handler(client *goplay.Client, builder compiler.BuildService) *APIv2Handler {
	return &APIv2Handler{
		logger:   zap.L().Named("api.v2"),
		compiler: builder,
		client:   client,
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
		DefaultFileName: snippet.FileName,
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

	payload, _, err := fileSetFromRequest(r)
	if err != nil {
		return err
	}

	res, err := h.client.Compile(ctx, goplay.CompileRequest{
		Version: goplay.DefaultVersion,
		WithVet: params.Vet,
		Body:    payload.Bytes(),
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

func (h *APIv2Handler) Mount(r *mux.Router) {
	r.Path("/run").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleRun))
	r.Path("/format").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleFormat))
	r.Path("/share").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleShare))
	r.Path("/share/{id}").Methods(http.MethodGet).HandlerFunc(WrapHandler(h.HandleGetSnippet))
}

func fileSetFromRequest(r *http.Request) (goplay.FileSet, []string, error) {
	reader := http.MaxBytesReader(nil, r.Body, goplay.MaxSnippetSize)
	defer reader.Close()

	body := new(FilesPayload)
	if err := json.NewDecoder(reader).Decode(body); err != nil {
		maxBytesErr := new(http.MaxBytesError)
		if errors.As(err, &maxBytesErr) {
			return goplay.FileSet{}, nil, ErrSnippetTooLarge
		}

		return goplay.FileSet{}, nil, NewBadRequestError(err)
	}

	if len(body.Files) == 0 {
		return goplay.FileSet{}, nil, ErrEmptyRequest
	}

	payload := goplay.NewFileSet(goplay.MaxSnippetSize)
	fileNames := make([]string, 0, len(body.Files))
	for name, contents := range body.Files {
		fileNames = append(fileNames, name)
		if err := payload.Add(name, contents); err != nil {
			return payload, fileNames, NewBadRequestError(err)
		}
	}

	return payload, fileNames, nil
}
