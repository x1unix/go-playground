package goplay

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

const (
	userAgent = "goplay.x1unix.com/1.0 (http://goplay.x1unix.com/)"
	goPlayURL = "https://play.golang.org"

	// maxSnippetSize value taken from
	// https://github.com/golang/playground/blob/master/app/goplay/share.go
	maxSnippetSize = 64 * 1024
)

var ErrSnippetTooLarge = fmt.Errorf("code snippet too large (max %d bytes)", maxSnippetSize)

func newRequest(ctx context.Context, method, queryPath string, body io.Reader) (*http.Request, error) {
	uri := goPlayURL + "/" + queryPath
	req, err := http.NewRequestWithContext(ctx, method, uri, body)
	if err != nil {
		return nil, err
	}

	req.Header.Add("User-Agent", userAgent)
	return req, nil
}

func getRequest(ctx context.Context, queryPath string) (*http.Response, error) {
	req, err := newRequest(ctx, http.MethodGet, queryPath, nil)
	if err != nil {
		return nil, nil
	}

	return http.DefaultClient.Do(req)
}

func doRequest(ctx context.Context, method, url, contentType string, body io.Reader) ([]byte, error) {
	req, err := newRequest(ctx, method, url, body)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Content-Type", contentType)
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	bodyBytes := &bytes.Buffer{}
	_, err = io.Copy(bodyBytes, io.LimitReader(response.Body, maxSnippetSize+1))
	defer response.Body.Close()
	if err != nil {
		return nil, err
	}
	if err = ValidateContentLength(bodyBytes); err != nil {
		return nil, err
	}

	return bodyBytes.Bytes(), nil
}

func postForm(ctx context.Context, url string, data url.Values) ([]byte, error) {
	return doRequest(
		ctx, "POST", url,
		"application/x-www-form-urlencoded", strings.NewReader(data.Encode()),
	)
}
