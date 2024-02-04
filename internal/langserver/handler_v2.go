package langserver

import (
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

	WriteJSON(w, FilesResponse{Files: results})
	return nil
}

func (h *APIv2Handler) HandleRunCode(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	params, err := RunParamsFromQuery(r.URL.Query())
	if err != nil {
		return NewBadRequestError(err)
	}

	if err := r.ParseMultipartForm(goplay.MaxSnippetSize); err != nil {
		return NewBadRequestError(err)
	}

	defer r.Body.Close()
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
	r.Path("/run").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleRunCode))
}

func fileSetFromRequest(r *http.Request) (goplay.FileSet, []string, error) {
	payload := goplay.NewFileSet(int(r.ContentLength))
	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		return payload, nil, NewBadRequestError(ErrEmptyRequest)
	}

	fileNames := make([]string, 0, len(files))
	for _, item := range files {
		fileNames = append(fileNames, item.Filename)
		f, err := item.Open()
		if err != nil {
			return payload, nil, NewBadRequestError(fmt.Errorf("cannot read file %q: %w", item.Filename, err))
		}

		if err := payload.Add(item.Filename, f); err != nil {
			return payload, fileNames, NewBadRequestError(err)
		}
	}

	return payload, fileNames, nil
}
