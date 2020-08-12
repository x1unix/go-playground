package goplay

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	defaultUserAgent = "goplay.tools/1.0 (http://goplay.tools/)"
	playgroundUrl    = "https://play.golang.org"

	// maxSnippetSize value taken from
	// https://github.com/golang/playground/blob/master/app/goplay/share.go
	maxSnippetSize = 64 * 1024
)

// ErrSnippetTooLarge is snippet max size limit error
var ErrSnippetTooLarge = fmt.Errorf("code snippet too large (max %d bytes)", maxSnippetSize)

// Client is Go Playground API client
type Client struct {
	client    http.Client
	baseUrl   string
	userAgent string
}

// NewClient returns new Go playground client
func NewClient(baseUrl, userAgent string, timeout time.Duration) *Client {
	return &Client{
		baseUrl:   baseUrl,
		userAgent: userAgent,
		client: http.Client{
			Timeout: timeout,
			Transport: &http.Transport{
				DialContext: (&net.Dialer{
					Timeout: timeout,
				}).DialContext,
				TLSHandshakeTimeout: timeout,
			},
		},
	}
}

// NewDefaultClient returns Go Playground client with defaults
func NewDefaultClient() *Client {
	return NewClient(playgroundUrl, defaultUserAgent, 15*time.Second)
}

func (c *Client) newRequest(ctx context.Context, method, queryPath string, body io.Reader) (*http.Request, error) {
	uri := c.baseUrl + "/" + queryPath
	req, err := http.NewRequestWithContext(ctx, method, uri, body)
	if err != nil {
		return nil, err
	}

	req.Header.Add("User-Agent", c.userAgent)
	return req, nil
}

func (c *Client) getRequest(ctx context.Context, queryPath string) (*http.Response, error) {
	req, err := c.newRequest(ctx, http.MethodGet, queryPath, nil)
	if err != nil {
		return nil, nil
	}

	return c.client.Do(req)
}

func (c *Client) doRequest(ctx context.Context, method, url, contentType string, body io.Reader) ([]byte, error) {
	req, err := c.newRequest(ctx, method, url, body)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Content-Type", contentType)
	response, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}

	bodyBytes := &bytes.Buffer{}
	_, err = io.Copy(bodyBytes, io.LimitReader(response.Body, maxSnippetSize+1))
	defer response.Body.Close()
	if err != nil {
		return nil, err
	}
	if err = ValidateContentLength(bodyBytes.Len()); err != nil {
		return nil, err
	}

	return bodyBytes.Bytes(), nil
}

func (c *Client) postForm(ctx context.Context, url string, data url.Values) ([]byte, error) {
	return c.doRequest(
		ctx, "POST", url,
		"application/x-www-form-urlencoded", strings.NewReader(data.Encode()),
	)
}
