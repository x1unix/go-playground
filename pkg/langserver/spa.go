package langserver

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

const (
	IndexFileName    = "index.html"
	NotFoundFileName = "404.html"
)

type httpStatusInterceptor struct {
	http.ResponseWriter
	desiredStatus int
}

func (i httpStatusInterceptor) WriteHeader(_ int) {
	i.ResponseWriter.WriteHeader(i.desiredStatus)
}

// SpaFileServer is a wrapper around http.FileServer for serving SPA contents.
type SpaFileServer struct {
	root            string
	NotFoundHandler http.Handler
	templateVars    TemplateArguments
}

// ServeHTTP implements http.Handler
func (fs *SpaFileServer) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	if containsDotDot(r.URL.Path) {
		Errorf(http.StatusNotFound, "Not Found").WriteResponse(rw)
		return
	}

	//if empty, set current directory
	dir := fs.root
	if dir == "" {
		dir = "."
	}

	//add prefix and clean
	upath := r.URL.Path
	if !strings.HasPrefix(upath, "/") {
		upath = "/" + upath
		r.URL.Path = upath
	}
	upath = path.Clean(upath)

	//path to file
	name := path.Join(dir, filepath.FromSlash(upath))

	//check if file exists
	if _, err := os.Stat(name); err != nil {
		if os.IsNotExist(err) {
			fs.NotFoundHandler.ServeHTTP(rw, r)
			return
		}
	}

	http.ServeFile(rw, r, name)
}

func containsDotDot(v string) bool {
	if !strings.Contains(v, "..") {
		return false
	}
	for _, ent := range strings.FieldsFunc(v, isSlashRune) {
		if ent == ".." {
			return true
		}
	}
	return false
}

func isSlashRune(r rune) bool { return r == '/' || r == '\\' }

// NewSpaFileServer returns SPA handler
func NewSpaFileServer(root string, tplVars TemplateArguments) *SpaFileServer {
	notFoundHandler := NewFileServerWithStatus(filepath.Join(root, NotFoundFileName), http.StatusNotFound)
	return &SpaFileServer{
		NotFoundHandler: notFoundHandler,
		root:            root,
		templateVars:    tplVars,
	}
}

// NewFileServerWithStatus returns http.Handler which serves specified file with desired HTTP status
func NewFileServerWithStatus(name string, code int) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		ServeFileWithStatus(rw, r, name, code)
	}
}

// ServeFileWithStatus serves file in HTTP response with specified HTTP status.
func ServeFileWithStatus(rw http.ResponseWriter, r *http.Request, name string, code int) {
	interceptor := httpStatusInterceptor{desiredStatus: code, ResponseWriter: rw}
	http.ServeFile(interceptor, r, name)
}
