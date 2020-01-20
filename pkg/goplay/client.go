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

func doRequest(ctx context.Context, method, url, contentType string, body io.Reader) ([]byte, error) {
	url = goPlayURL + "/" + url
	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Content-Type", contentType)
	req.Header.Add("User-Agent", userAgent)
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	var bodyBytes bytes.Buffer
	_, err = io.Copy(&bodyBytes, io.LimitReader(response.Body, maxSnippetSize+1))
	defer response.Body.Close()
	if err != nil {
		return nil, err
	}
	if bodyBytes.Len() > maxSnippetSize {
		return nil, ErrSnippetTooLarge
	}
	return bodyBytes.Bytes(), nil
}

func postForm(ctx context.Context, url string, data url.Values) ([]byte, error) {
	return doRequest(
		ctx, "POST", url,
		"application/x-www-form-urlencoded", strings.NewReader(data.Encode()),
	)
}
