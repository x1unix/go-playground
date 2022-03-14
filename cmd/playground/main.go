package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/x1unix/foundation/app"
	"github.com/x1unix/go-playground/pkg/analyzer"
	"github.com/x1unix/go-playground/pkg/compiler"
	"github.com/x1unix/go-playground/pkg/compiler/storage"
	"github.com/x1unix/go-playground/pkg/goplay"
	"github.com/x1unix/go-playground/pkg/langserver"
	"github.com/x1unix/go-playground/pkg/langserver/webutil"
	"github.com/x1unix/go-playground/pkg/util/cmdutil"
	"github.com/x1unix/go-playground/pkg/util/osutil"
	"go.uber.org/zap"
)

// Version is server version symbol. Should be replaced by linker during build
var Version = "testing"

type appArgs struct {
	packagesFile       string
	playgroundURL      string
	goTipPlaygroundURL string
	addr               string
	debug              bool
	buildDir           string
	cleanupInterval    string
	assetsDirectory    string
	googleAnalyticsID  string
	bypassEnvVarsList  []string
	connectTimeout     time.Duration
}

func (a appArgs) getCleanDuration() (time.Duration, error) {
	return time.ParseDuration(a.cleanupInterval)
}

func main() {
	wd, err := os.Getwd()
	if err != nil {
		_, _ = fmt.Fprintln(os.Stderr, "Failed to get current working directory:", err)
		wd = "."
	}

	args := appArgs{}
	flag.StringVar(&args.packagesFile, "f", "packages.json", "Path to packages index JSON file")
	flag.StringVar(&args.addr, "addr", ":8080", "TCP Listen address")
	flag.StringVar(&args.buildDir, "wasm-build-dir", os.TempDir(), "Directory for WASM builds")
	flag.StringVar(&args.cleanupInterval, "clean-interval", "10m", "Build directory cleanup interval")
	flag.StringVar(&args.playgroundURL, "playground-url", goplay.DefaultPlaygroundURL, "Go Playground URL")
	flag.StringVar(&args.goTipPlaygroundURL, "gotip-url", goplay.DefaultGoTipPlaygroundURL, "GoTip Playground URL")
	flag.BoolVar(&args.debug, "debug", false, "Enable debug mode")
	flag.StringVar(&args.assetsDirectory, "static-dir", filepath.Join(wd, "public"), "Path to web page assets (HTML, JS, etc)")
	flag.DurationVar(&args.connectTimeout, "timeout", 15*time.Second, "Go Playground server connect timeout")
	flag.StringVar(&args.googleAnalyticsID, "gtag-id", "", "Google Analytics tag ID (optional)")
	flag.Var(cmdutil.NewStringsListValue(&args.bypassEnvVarsList), "permit-env-vars", "Comma-separated allow list of environment variables passed to Go compiler tool")
	flag.Parse()

	l := getLogger(args.debug)
	defer l.Sync() //nolint:errcheck

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
	zap.S().Infof("Playground url: %q", args.playgroundURL)
	zap.S().Infof("Packages file is %q", args.packagesFile)
	zap.S().Infof("Cleanup interval is %s", cleanInterval.String())
	zap.S().Infof("Serving web page from %q", args.assetsDirectory)
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

	// Initialize services
	pgClient := goplay.NewClient(args.playgroundURL, goplay.DefaultUserAgent, args.connectTimeout)
	goTipClient := goplay.NewClient(args.goTipPlaygroundURL, goplay.DefaultUserAgent, args.connectTimeout)
	clients := &langserver.PlaygroundServices{
		Default: pgClient,
		GoTip:   goTipClient,
	}
	buildCfg := compiler.BuildEnvironmentConfig{
		IncludedEnvironmentVariables: osutil.SelectEnvironmentVariables(args.bypassEnvVarsList...),
	}
	zap.L().Debug("Loaded list of environment variables used by compiler",
		zap.Any("vars", buildCfg.IncludedEnvironmentVariables))
	buildSvc := compiler.NewBuildService(zap.S(), buildCfg, store)

	// Initialize API endpoints
	r := mux.NewRouter()
	svcCfg := langserver.ServiceConfig{Version: Version}
	langserver.New(svcCfg, clients, packages, buildSvc).
		Mount(r.PathPrefix("/api").Subrouter())

	// Web UI routes
	tplVars := langserver.TemplateArguments{
		GoogleTagID: args.googleAnalyticsID,
	}
	if tplVars.GoogleTagID != "" {
		if err := webutil.ValidateGTag(tplVars.GoogleTagID); err != nil {
			zap.L().Error("invalid GTag ID value, parameter will be ignored",
				zap.String("gtag", tplVars.GoogleTagID), zap.Error(err))
			tplVars.GoogleTagID = ""
		}
	}

	indexHandler := langserver.NewTemplateFileServer(zap.L(), filepath.Join(args.assetsDirectory, langserver.IndexFileName), tplVars)
	spaHandler := langserver.NewSpaFileServer(args.assetsDirectory, tplVars)
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
