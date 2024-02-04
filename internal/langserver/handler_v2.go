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

const filesFormKey = "files"

var ErrEmptyRequest = errors.New("empty request")

type APIv2Handler struct {
	logger   *zap.SugaredLogger
	compiler compiler.BuildService
	client   *goplay.Client
}

func NewAPIv2Handler(client *goplay.Client, builder compiler.BuildService) *APIv2Handler {
	return &APIv2Handler{
		logger:   zap.S().Named("api.v2"),
		compiler: builder,
		client:   client,
	}
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

		h.logger.Error(err)
		return err
	}

	if err := rsp.HasError(); err != nil {
		return NewBadRequestError(err)
	}

	results, err := goplay.SplitFileSet(rsp.Body, fileNames[0])
	if err != nil {
		h.logger.Desugar().Error("failed to reconstruct files set from format response", zap.Error(err), zap.String("rsp", rsp.Body))
		return NewHTTPError(http.StatusInternalServerError, fmt.Errorf("failed to reconstruct files set from format response: %w", err))
	}

	WriteJSON(w, FilesRequest{Files: results})
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

	h.logger.Debugw("response from compiler", "res", res)
	WriteJSON(w, RunResponse{
		Events: res.Events,
	})

	return nil
}

func (h *APIv2Handler) Mount(r *mux.Router) {
	r.Path("/run").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleRun))
	r.Path("/format").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleFormat))
}

func fileSetFromRequest(r *http.Request) (goplay.FileSet, []string, error) {
	reader := http.MaxBytesReader(nil, r.Body, goplay.MaxSnippetSize)
	defer reader.Close()

	body := new(FilesRequest)
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
