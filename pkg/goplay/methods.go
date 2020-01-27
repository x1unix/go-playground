package goplay

import (
	"context"
	"encoding/json"
	"fmt"
	"go.uber.org/zap"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
)

func ValidateContentLength(itemLen int) error {
	if itemLen > maxSnippetSize {
		return ErrSnippetTooLarge
	}

	return nil
}

func GetSnippet(ctx context.Context, snippetID string) (*Snippet, error) {
	fileName := snippetID + ".go"
	resp, err := getRequest(ctx, "p/"+fileName)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		snippet, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		return &Snippet{
			FileName: fileName,
			Contents: string(snippet),
		}, nil
	case http.StatusNotFound:
		return nil, ErrSnippetNotFound
	default:
		return nil, fmt.Errorf("error from Go Playground server - %d %s", resp.StatusCode, resp.Status)
	}
}

func Share(ctx context.Context, src io.Reader) (string, error) {
	resp, err := doRequest(ctx, http.MethodPost, "share", "text/plain", src)
	if err != nil {
		return "", err
	}

	shareID := string(resp)
	return shareID, nil
}

func GoImports(ctx context.Context, src []byte) (*FmtResponse, error) {
	form := url.Values{}
	form.Add("imports", "true")
	form.Add("body", string(src))

	resp, err := postForm(ctx, "fmt", form)
	if err != nil {
		return nil, fmt.Errorf("failed to contact Go Playground - %s", err)
	}

	dest := &FmtResponse{}
	if err := json.Unmarshal(resp, dest); err != nil {
		zap.S().Errorw("GoImports response is not JSON",
			"err", err,
			"resp", string(resp),
		)
		return nil, fmt.Errorf("failed to decode upstream server response: %s", err)
	}

	return dest, nil
}

func Compile(ctx context.Context, src []byte) (*CompileResponse, error) {
	form := url.Values{}
	form.Add("body", string(src))
	form.Add("version", "2")

	resp, err := postForm(ctx, "compile", form)
	if err != nil {
		return nil, err
	}

	dest := &CompileResponse{}
	if err := json.Unmarshal(resp, dest); err != nil {
		zap.S().Errorw("Compiler response is not JSON",
			"err", err,
			"resp", string(resp),
		)
		return nil, fmt.Errorf("failed to decode upstream server response: %s", err)
	}

	return dest, err
}
