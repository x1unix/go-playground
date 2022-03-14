package langserver

import (
	"bytes"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"text/template"
	"time"

	"go.uber.org/zap"
)

type nopRSeeker struct {
	size int64
	io.Reader
}

func newNopRSeeker(size int, r io.Reader) *nopRSeeker {
	return &nopRSeeker{
		size:   int64(size),
		Reader: r,
	}
}

type TemplateArguments struct {
	GoogleTagID string
}

type TemplateFileServer struct {
	log          *zap.Logger
	filePath     string
	templateVars TemplateArguments
	once         *sync.Once
	buffer       io.ReadSeeker
	modTime      time.Time
}

// Seek implements io.Seeker
func (n nopRSeeker) Seek(_ int64, whence int) (int64, error) {
	switch whence {
	case io.SeekStart:
		return 0, nil
	default:
		return n.size, nil
	}
}

// NewTemplateFileServer returns handler which compiles and serves HTML page template.
func NewTemplateFileServer(logger *zap.Logger, filePath string, tplVars TemplateArguments) *TemplateFileServer {
	return &TemplateFileServer{
		log:          logger,
		once:         new(sync.Once),
		filePath:     filePath,
		templateVars: tplVars,
	}
}

func (fs *TemplateFileServer) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	fs.once.Do(fs.precompileTemplate)

	if fs.buffer == nil {
		http.ServeFile(rw, r, fs.filePath)
		return
	}

	http.ServeContent(rw, r, fs.filePath, fs.modTime, fs.buffer)
}

func (fs *TemplateFileServer) precompileTemplate() {
	stat, err := os.Stat(fs.filePath)
	if err != nil {
		fs.log.Error("failed to read template file", zap.Error(err), zap.String("filePath", fs.filePath))
		return
	}

	tpl, err := template.New(filepath.Base(fs.filePath)).ParseFiles(fs.filePath)
	if err != nil {
		fs.log.Error("failed to parse page template", zap.Error(err), zap.String("filePath", fs.filePath))
		return
	}

	buff := bytes.NewBuffer(make([]byte, 0, stat.Size()))
	if err := tpl.Execute(buff, fs.templateVars); err != nil {
		fs.log.Error("failed to execute page template", zap.Error(err), zap.String("filePath", fs.filePath))
		return
	}

	fs.log.Info("successfully compiled page template", zap.String("filePath", fs.filePath))
	fs.buffer = newNopRSeeker(buff.Len(), buff)
	fs.modTime = time.Now()
}
