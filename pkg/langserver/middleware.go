package langserver

import (
	"github.com/x1unix/go-playground/pkg/goplay"
	"net/http"
)

type HandlerFunc func(http.ResponseWriter, *http.Request) error
type GuardFn func(r *http.Request) error

func WrapHandler(h HandlerFunc, guards ...GuardFn) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if len(guards) == 0 {
			for _, guardFn := range guards {
				if err := guardFn(r); err != nil {
					handleError(err, w)
					return
				}
			}
		}

		handleError(h(w, r), w)
	}
}

func ValidateContentLength(r *http.Request) error {
	if err := goplay.ValidateContentLength(int(r.ContentLength)); err != nil {
		return NewHTTPError(http.StatusRequestEntityTooLarge, err)
	}

	return nil
}

func handleError(err error, w http.ResponseWriter) {
	if err == nil {
		return
	}

	if httpErr, ok := err.(*HTTPError); ok {
		httpErr.WriteResponse(w)
		return
	}

	resp := NewErrorResponse(err)
	resp.Write(w)
}
