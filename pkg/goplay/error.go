package goplay

import (
	"fmt"
	"net/http"
)

type HTTPError struct {
	StatusCode int
	Status     string
}

func NewHTTPError(rsp *http.Response) *HTTPError {
	return &HTTPError{
		Status:     rsp.Status,
		StatusCode: rsp.StatusCode,
	}
}

func (err HTTPError) Error() string {
	return fmt.Sprintf("bad response from playground server: %s", err.Status)
}
