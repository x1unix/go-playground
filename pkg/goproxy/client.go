// Package goproxy provides Go modules proxy API client.
package goproxy

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

const (
	jsonContentType = "application/json"

	DefaultProxyURL = "https://proxy.golang.org"
)

type Client struct {
	url    string
	client *http.Client
}

func NewClient(client *http.Client, baseURL string) *Client {
	return &Client{
		url:    baseURL,
		client: client,
	}
}

// NewClientWithDefaults returns a new go modules proxy client with default http client
// and official Go Modules proxy server.
func NewClientWithDefaults() *Client {
	return NewClient(http.DefaultClient, DefaultProxyURL)
}

// SetBaseURL updates proxy base URL
func (c *Client) SetBaseURL(baseURL string) {
	c.url = baseURL
}

func (c *Client) getURL(segments ...string) string {
	return strings.Join(append([]string{c.url}, segments...), "/")
}

func (c *Client) get(ctx context.Context, segments ...string) (*http.Response, error) {
	uri := c.getURL(segments...)
	req, err := http.NewRequest(http.MethodGet, uri, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare request %q: %w", uri, err)
	}

	req = req.WithContext(ctx)
	rsp, err := c.client.Do(req)
	switch err {
	case context.Canceled, context.DeadlineExceeded:
		return nil, err
	}

	if err != nil {
		return nil, fmt.Errorf("%q: failed to request: %w", uri, err)
	}

	if rsp.StatusCode >= 400 {
		defer rsp.Body.Close()
		return nil, buildHTTPError(req, rsp)
	}

	return rsp, nil
}

func (c *Client) getBody(ctx context.Context, segments ...string) (io.ReadCloser, error) {
	rsp, err := c.get(ctx, segments...)
	if err != nil {
		return nil, err
	}

	return rsp.Body, nil
}

func (c *Client) getJSON(ctx context.Context, out any, segments ...string) error {
	rsp, err := c.get(ctx, segments...)
	if err != nil {
		return err
	}

	defer silentClose(rsp.Body)
	contentType := rsp.Header.Get("Content-Type")
	if contentType != jsonContentType {
		return fmt.Errorf("response content type is not %q (got %q)",
			contentType, jsonContentType)
	}

	if err := json.NewDecoder(rsp.Body).Decode(out); err != nil {
		return fmt.Errorf("failed to parse server response: %w", err)
	}

	return nil
}

// GetVersions returns a list of module versions.
func (c *Client) GetVersions(ctx context.Context, pkgUrl string) ([]string, error) {
	body, err := c.getBody(ctx, pkgUrl, "@v/list")
	if err != nil {
		return nil, err
	}

	defer silentClose(body)
	scanner := bufio.NewScanner(body)
	items := make([]string, 0, 32)
	for scanner.Scan() {
		// use bytes to avoid multiple string copy
		item := bytes.TrimSpace(scanner.Bytes())
		if len(item) == 0 {
			continue
		}

		items = append(items, string(item))
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("failed to parse server response: %w", err)
	}

	return items, nil
}

// GetLatestVersion returns information about a latest module version.
func (c *Client) GetLatestVersion(ctx context.Context, pkgUrl string) (*VersionInfo, error) {
	rsp := new(VersionInfo)
	err := c.getJSON(ctx, rsp, pkgUrl, "@latest")
	if err != nil {
		return nil, err
	}

	return rsp, nil
}

// GetVersionInfo returns information about module version.
func (c *Client) GetVersionInfo(ctx context.Context, pkgUrl, version string) (*VersionInfo, error) {
	rsp := new(VersionInfo)
	err := c.getJSON(ctx, rsp, pkgUrl, "@v", version+".info")
	if err != nil {
		return nil, err
	}
	return rsp, nil
}

// GetModuleFile returns go.mod file of specific version of a module.
func (c *Client) GetModuleFile(ctx context.Context, pkgUrl, version string) ([]byte, error) {
	rsp, err := c.getBody(ctx, pkgUrl, "@v", version+".mod")
	if err != nil {
		return nil, err
	}

	defer rsp.Close()
	data, err := io.ReadAll(rsp)
	return data, err
}

// GetModuleSource returns zip archive stream for that version of the given module.
//
// Returns a io.ReadCloser-compatible struct with size and content type information.
func (c *Client) GetModuleSource(ctx context.Context, pkgUrl, version string) (*ArchiveReadCloser, error) {
	rsp, err := c.get(ctx, pkgUrl, "@v", version+".zip")
	if err != nil {
		return nil, err
	}

	result := &ArchiveReadCloser{
		ReadCloser:  rsp.Body,
		ContentType: rsp.Header.Get("Content-Type"),
	}

	contentLengthHead := rsp.Header.Get("Content-Length")
	result.Size, _ = strconv.ParseInt(contentLengthHead, 10, 64)
	return result, nil
}

func silentClose(closer io.Closer) {
	_ = closer.Close()
}
