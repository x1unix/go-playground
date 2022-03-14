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

	buff := new(bytes.Buffer)
	buff.Grow(int(stat.Size()))
	if err := tpl.Execute(buff, fs.templateVars); err != nil {
		fs.log.Error("failed to execute page template", zap.Error(err), zap.String("filePath", fs.filePath))
		return
	}

	fs.log.Info("successfully compiled page template", zap.String("filePath", fs.filePath))
	fs.buffer = bytes.NewReader(buff.Bytes())
	fs.modTime = time.Now()
}
