package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/x1unix/foundation/app"
	"github.com/x1unix/go-playground/pkg/analyzer"
	"github.com/x1unix/go-playground/pkg/compiler"
	"github.com/x1unix/go-playground/pkg/compiler/storage"
	"github.com/x1unix/go-playground/pkg/goplay"
	"github.com/x1unix/go-playground/pkg/langserver"
	"go.uber.org/zap"
)

// Version is server version symbol. Should be replaced by linker during build
var Version = "testing"

type appArgs struct {
	packagesFile    string
	playgroundUrl   string
	addr            string
	debug           bool
	buildDir        string
	cleanupInterval string
}

func (a appArgs) getCleanDuration() (time.Duration, error) {
	return time.ParseDuration(a.cleanupInterval)
}

func main() {
	args := appArgs{}
	flag.StringVar(&args.packagesFile, "f", "packages.json", "Path to packages index JSON file")
	flag.StringVar(&args.addr, "addr", ":8080", "TCP Listen address")
	flag.StringVar(&args.buildDir, "wasm-build-dir", os.TempDir(), "Directory for WASM builds")
	flag.StringVar(&args.cleanupInterval, "clean-interval", "10m", "Build directory cleanup interval")
	flag.StringVar(&args.playgroundUrl, "playground-url", goplay.DefaultPlaygroundURL, "Go Playground URL")
	flag.BoolVar(&args.debug, "debug", false, "Enable debug mode")

	l := getLogger(args.debug)
	defer l.Sync() //nolint:errcheck
	flag.Parse()

	goRoot, err := compiler.GOROOT()
	if err != nil {
		l.Fatal("failed to find GOROOT environment variable value", zap.Error(err))
	}

	if err := start(goRoot, args); err != nil {
		l.Sugar().Fatal(err)
	}
}

func getLogger(debug bool) (l *zap.Logger) {
	var err error
	if debug {
		l, err = zap.NewDevelopment()
	} else {
		l, err = zap.NewProduction()
	}

	if err != nil {
		zap.S().Fatal(err)
	}

	zap.ReplaceGlobals(l)
	analyzer.SetLogger(l)
	return l
}

func start(goRoot string, args appArgs) error {
	cleanInterval, err := args.getCleanDuration()
	if err != nil {
		return fmt.Errorf("invalid cleanup interval parameter: %s", err)
	}

	zap.S().Info("Server version: ", Version)
	zap.S().Infof("GOROOT is %q", goRoot)
	zap.S().Infof("Playground url: %q", args.playgroundUrl)
	zap.S().Infof("Packages file is %q", args.packagesFile)
	zap.S().Infof("Cleanup interval is %s", cleanInterval.String())
	analyzer.SetRoot(goRoot)
	packages, err := analyzer.ReadPackagesFile(args.packagesFile)
	if err != nil {
		return fmt.Errorf("failed to read packages file %q: %s", args.packagesFile, err)
	}

	store, err := storage.NewLocalStorage(zap.S(), args.buildDir)
	if err != nil {
		return err
	}

	ctx, _ := app.GetApplicationContext()
	wg := &sync.WaitGroup{}
	go store.StartCleaner(ctx, cleanInterval, nil)

	r := mux.NewRouter()
	pg := goplay.NewClient(args.playgroundUrl, goplay.DefaultUserAgent, 15*time.Second)

	// API routes
	langserver.New(Version, pg, packages, compiler.NewBuildService(zap.S(), store)).
		Mount(r.PathPrefix("/api").Subrouter())

	// Web UI routes
	indexHandler := langserver.NewIndexFileServer("./public")
	spaHandler := langserver.NewSpaFileServer("./public")
	r.Path("/").
		Handler(indexHandler)
	r.Path("/snippet/{snippetID:[A-Za-z0-9_-]+}").
		Handler(indexHandler)
	r.PathPrefix("/").
		Handler(spaHandler)

	var handler http.Handler
	if args.debug {
		zap.S().Info("Debug mode enabled, CORS disabled")
		handler = langserver.NewCORSDisablerWrapper(r)
	} else {
		handler = r
	}

	server := &http.Server{
		Addr:         args.addr,
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  15 * time.Second,
	}

	if err := startHttpServer(ctx, wg, server); err != nil {
		return err
	}

	wg.Wait()
	return nil
}

func startHttpServer(ctx context.Context, wg *sync.WaitGroup, server *http.Server) error {
	logger := zap.S()
	go func() {
		<-ctx.Done()
		logger.Info("Shutting down server...")
		shutdownCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		defer wg.Done()
		server.SetKeepAlivesEnabled(false)
		if err := server.Shutdown(shutdownCtx); err != nil {
			if err == context.Canceled {
				return
			}
			logger.Errorf("Could not gracefully shutdown the server: %v\n", err)
		}
	}()

	wg.Add(1)
	logger.Infof("Listening on %q", server.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("cannot start server on %q: %s", server.Addr, err)
	}

	return nil
}
