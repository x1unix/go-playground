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
	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		return NewBadRequestError(ErrEmptyRequest)
	}

	payload := goplay.NewFileSet(int(r.ContentLength))
	for _, item := range files {
		f, err := item.Open()
		if err != nil {
			return NewBadRequestError(fmt.Errorf("cannot read file %q: %w", item.Filename, err))
		}

		if err := payload.Add(item.Filename, f); err != nil {
			return NewBadRequestError(err)
		}
	}

	res, err := h.client.Compile(ctx, goplay.CompileRequest{
		Version: goplay.DefaultVersion,
		WithVet: params.Vet,
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
