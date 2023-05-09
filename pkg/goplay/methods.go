package goplay

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// ValidateContentLength validates snippet size
func ValidateContentLength(itemLen int) error {
	if itemLen > maxSnippetSize {
		return ErrSnippetTooLarge
	}
	return nil
}

// GetSnippet returns snippet from Go playground
func (c *Client) GetSnippet(ctx context.Context, snippetID string) (*Snippet, error) {
	fileName := snippetID + ".go"
	resp, err := c.getRequest(ctx, "p/"+fileName)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusOK:
		snippet, err := io.ReadAll(resp.Body)
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
		return nil, NewHTTPError(resp)
	}
}

// Share shares snippet to go playground
func (c *Client) Share(ctx context.Context, src io.Reader) (string, error) {
	resp, err := c.doRequest(ctx, http.MethodPost, "share", "text/plain", src)
	if err != nil {
		return "", err
	}

	shareID := string(resp)
	return shareID, nil
}

// GoImports performs Goimports
func (c *Client) GoImports(ctx context.Context, src []byte, backend Backend) (*FmtResponse, error) {
	form := url.Values{}
	form.Add("imports", "true")
	form.Add("body", string(src))

	dest := new(FmtResponse)
	urlPath := appendBackendToPath("fmt", backend)
	err := c.postJSON(ctx, urlPath, form, dest)
	return dest, err
}

// Compile runs code in goplayground and returns response
func (c *Client) Compile(ctx context.Context, req CompileRequest, backend string) (*CompileResponse, error) {
	dest := new(CompileResponse)

	form := req.URLValues()
	urlPath := appendBackendToPath("compile", backend)
	err := c.postJSON(ctx, urlPath, form, dest)
	return dest, err
}

// ValidateBackend validates Go Playground backend name.
func ValidateBackend(backend Backend) bool {
	switch backend {
	case BackendGoCurrent, BackendGoTip, BackendGoPrev:
		return true
	}

	return false
}

func appendBackendToPath(urlPath string, backend Backend) string {
	if backend == "" {
		return urlPath
	}

	return fmt.Sprintf("%s?backend=%s", urlPath, backend)
}
