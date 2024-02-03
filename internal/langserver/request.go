package langserver

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/x1unix/go-playground/pkg/goplay"
)

// RunParams is code run request parameters
type RunParams struct {
	// Vet enables go vet
	Vet bool

	// Format identifies whether to format code before run.
	//
	// Deprecated and used only for v1.
	Format bool

	// Backend is Go run backend.
	Backend string
}

func RunParamsFromQuery(query url.Values) (params RunParams, err error) {
	params = RunParams{
		Backend: goplay.BackendGoCurrent,
	}

	params.Vet, err = parseBoolQueryParam(query, "vet", false)
	if err != nil {
		return params, err
	}

	params.Format, err = parseBoolQueryParam(query, "format", false)
	if err != nil {
		return params, err
	}

	params.Backend, err = backendFromQuery(query)
	return params, err
}

func parseBoolQueryParam(query url.Values, key string, defaults bool) (bool, error) {
	val := strings.TrimSpace(query.Get(key))
	if val == "" {
		return defaults, nil
	}

	boolVal, err := strconv.ParseBool(val)
	if err != nil {
		return false, Errorf(
			http.StatusBadRequest,
			"invalid %q query parameter value (expected boolean)", key,
		)
	}

	return boolVal, nil
}

func isContentLengthError(err error) bool {
	if httpErr, ok := goplay.IsHTTPError(err); ok {
		if httpErr.StatusCode == http.StatusRequestEntityTooLarge {
			return true
		}
	}

	return false
}
func backendFromQuery(query url.Values) (goplay.Backend, error) {
	backendName := query.Get("backend")
	if backendName == "" {
		return goplay.BackendGoCurrent, nil
	}

	if !goplay.ValidateBackend(backendName) {
		return "", fmt.Errorf("invalid backend name %q", backendName)
	}

	return backendName, nil
}

func getPayloadFromRequest(r *http.Request) ([]byte, error) {
	// see: https://github.com/golang/playground/blob/master/share.go#L69
	var buff bytes.Buffer
	buff.Grow(goplay.MaxSnippetSize)

	defer r.Body.Close()
	_, err := io.Copy(&buff, io.LimitReader(r.Body, goplay.MaxSnippetSize+1))
	if err != nil {
		return nil, Errorf(http.StatusBadGateway, "failed to read request: %w", err)
	}

	if buff.Len() > goplay.MaxSnippetSize {
		return nil, ErrSnippetTooLarge
	}

	return buff.Bytes(), nil
}
