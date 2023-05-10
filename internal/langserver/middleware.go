package langserver

import (
	"github.com/x1unix/go-playground/pkg/goplay"
	"net/http"
)

// HandlerFunc is langserver request handler
type HandlerFunc func(http.ResponseWriter, *http.Request) error

// GuardFn is guard middleware handler
type GuardFn func(r *http.Request) error

// WrapHandler wraps handler
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

// ValidateContentLength validates Go code snippet size
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
