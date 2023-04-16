package goproxy

import (
	"errors"
	"fmt"
	"io"
	"net/http"
)

type HTTPError struct {
	Code    int
	URL     string
	Message string
}

func buildHTTPError(req *http.Request, rsp *http.Response) *HTTPError {
	msg, _ := io.ReadAll(rsp.Body)
	return &HTTPError{
		Code:    rsp.StatusCode,
		URL:     req.URL.String(),
		Message: string(msg),
	}
}

func (err *HTTPError) Error() string {
	if err.Message != "" {
		return fmt.Sprintf("%s (HTTP code: %d)", err.Message, err.Code)
	}

	return fmt.Sprintf("GET %s - %s (HTTP code: %d)",
		err.URL, http.StatusText(err.Code), err.Code)
}

func IsHTTPError(err error) (*HTTPError, bool) {
	target := new(HTTPError)
	ok := errors.As(err, &target)
	if !ok {
		return nil, false
	}

	return target, true
}

func IsNotFoundError(err error) (*HTTPError, bool) {
	httpErr, ok := IsHTTPError(err)
	if !ok {
		return nil, false
	}

	if httpErr.Code != http.StatusNotFound {
		return nil, false
	}

	return httpErr, true
}
