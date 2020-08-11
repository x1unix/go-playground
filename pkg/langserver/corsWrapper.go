package langserver

import "net/http"

type corsWrapper struct {
	h http.Handler
}

// ServeHTTP implements http.Handler
func (cw corsWrapper) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	cw.h.ServeHTTP(w, r)
}

// NewCORSDisablerWrapper returns new CORS middleware
func NewCORSDisablerWrapper(parent http.Handler) http.Handler {
	return corsWrapper{h: parent}
}
