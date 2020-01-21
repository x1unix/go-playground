package langserver

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// Advanced static server
type spaFileServer struct {
	root            http.Dir
	NotFoundHandler func(http.ResponseWriter, *http.Request)
}

func (fs *spaFileServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	if containsDotDot(r.URL.Path) {
		Errorf(http.StatusBadRequest, "Bad Request").Write(w)
		return
	}

	//if empty, set current directory
	dir := string(fs.root)
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
	f, err := os.Open(name)
	if err != nil {
		if os.IsNotExist(err) {
			Errorf(http.StatusNotFound, "Not Found").Write(w)
			return
		}
	}
	defer f.Close()

	http.ServeFile(w, r, name)
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

func SpaFileServer(root http.Dir) http.Handler {
	return &spaFileServer{root: root}
}
