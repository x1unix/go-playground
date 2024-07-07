package server

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/x1unix/go-playground/pkg/goplay"
)

// evalPayloadFromRequest validates and extracts snippet payload for Go Playground API evaluate request.
func evalPayloadFromRequest(r *http.Request) ([]byte, error) {
	body, err := filesPayloadFromRequest(r)
	if err != nil {
		return nil, err
	}

	switch len(body.Files) {
	case 0:
		return nil, nil
	case 1:
		// Go playground might behave inadequately with unit-tests when multi-file snippet has only one file.
		// See: https://github.com/x1unix/go-playground/issues/324
		for _, v := range body.Files {
			return []byte(v), nil
		}
	}

	// Official Go Playground can't run unit-tests in multi-file snippets.
	// We can't do anything about it, just detect a case and return an error to a user.
	// See: https://github.com/golang/go/issues/68327
	if body.HasUnitTests() {
		return nil, errors.New(
			"Due to Go Playground bug, unit test snippets can't have multiple files.\n" +
				"Please remove other Go files or use WebAssembly environment instead.\n\n" +
				"See: https://github.com/golang/go/issues/32403",
		)
	}

	fileSet := goplay.NewFileSet(goplay.MaxSnippetSize)
	for name, contents := range body.Files {
		if err := fileSet.Add(name, []byte(contents)); err != nil {
			return nil, NewBadRequestError(err)
		}
	}

	return fileSet.Bytes(), nil
}

func fileSetFromRequest(r *http.Request) (goplay.FileSet, []string, error) {
	body, err := filesPayloadFromRequest(r)
	if err != nil {
		return goplay.FileSet{}, nil, err
	}

	payload := goplay.NewFileSet(goplay.MaxSnippetSize)
	fileNames := make([]string, 0, len(body.Files))
	for name, contents := range body.Files {
		fileNames = append(fileNames, name)
		if err := payload.Add(name, []byte(contents)); err != nil {
			return payload, fileNames, NewBadRequestError(err)
		}
	}

	return payload, fileNames, nil
}

func buildFilesFromRequest(r *http.Request) (map[string][]byte, error) {
	body, err := filesPayloadFromRequest(r)
	if err != nil {
		return nil, err
	}

	files := make(map[string][]byte, len(body.Files))
	for name, contents := range body.Files {
		files[name] = []byte(contents)
	}

	return files, nil
}

func filesPayloadFromRequest(r *http.Request) (*FilesPayload, error) {
	reader := http.MaxBytesReader(nil, r.Body, goplay.MaxSnippetSize)
	defer reader.Close()

	body := new(FilesPayload)
	if err := json.NewDecoder(reader).Decode(body); err != nil {
		maxBytesErr := new(http.MaxBytesError)
		if errors.As(err, &maxBytesErr) {
			return nil, ErrSnippetTooLarge
		}

		return nil, NewBadRequestError(err)
	}

	if len(body.Files) == 0 {
		return nil, ErrEmptyRequest
	}

	if err := body.Validate(); err != nil {
		return nil, NewBadRequestError(err)
	}

	return body, nil
}
