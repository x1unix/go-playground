package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/x1unix/foundation/app"
	"github.com/x1unix/go-playground/internal/builder"
	"github.com/x1unix/go-playground/internal/builder/storage"
	"github.com/x1unix/go-playground/internal/config"
	"github.com/x1unix/go-playground/internal/server"
	"github.com/x1unix/go-playground/internal/server/webutil"
	"github.com/x1unix/go-playground/pkg/goplay"
	"github.com/x1unix/go-playground/pkg/util/cmdutil"
	"github.com/x1unix/go-playground/pkg/util/osutil"
	"go.uber.org/zap"
)

// Version is server version symbol. Should be replaced by linker during build
var Version = "testing"

func main() {
	cfg, err := config.FromEnv(config.FromFlags())
	if err != nil {
		cmdutil.FatalOnError(err)
	}

	logger, err := cfg.Log.ZapLogger()
	if err != nil {
		cmdutil.FatalOnError(err)
	}
	zap.ReplaceGlobals(logger)
	defer logger.Sync() //nolint:errcheck

	if err := cfg.Validate(); err != nil {
		logger.Fatal("invalid server configuration", zap.Error(err))
	}

	if err := start(logger, cfg); err != nil {
		logger.Fatal("Failed to start application", zap.Error(err))
	}
}

func start(logger *zap.Logger, cfg *config.Config) error {
	logger.Info("Starting service",
		zap.String("version", Version), zap.Any("config", cfg))

	store, err := storage.NewLocalStorage(logger, cfg.Build.BuildDir)
	if err != nil {
		return err
	}

	ctx, _ := app.GetApplicationContext()
	wg := &sync.WaitGroup{}

	// Initialize services
	playgroundClient := goplay.NewClient(cfg.Playground.PlaygroundURL, goplay.DefaultUserAgent,
		cfg.Playground.ConnectTimeout)
	buildCfg := builder.BuildEnvironmentConfig{
		KeepGoModCache:               cfg.Build.SkipModuleCleanup,
		IncludedEnvironmentVariables: osutil.SelectEnvironmentVariables(cfg.Build.BypassEnvVarsList...),
	}
	logger.Debug("Loaded list of environment variables used by compiler",
		zap.Any("vars", buildCfg.IncludedEnvironmentVariables))
	buildSvc := builder.NewBuildService(zap.L(), buildCfg, store)

	// Start cleanup service
	if !cfg.Build.SkipModuleCleanup {
		cleanupSvc := builder.NewCleanupDispatchService(zap.L(), cfg.Build.CleanupInterval, buildSvc, store)
		go cleanupSvc.Start(ctx)
	}

	// Initialize API endpoints
	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api").Subrouter()
	svcCfg := server.ServiceConfig{Version: Version}
	server.NewAPIv1Handler(svcCfg, playgroundClient, buildSvc).
		Mount(apiRouter)

	apiv2Router := apiRouter.PathPrefix("/v2").Subrouter()
	server.NewAPIv2Handler(server.APIv2HandlerConfig{
		Client:       playgroundClient,
		Builder:      buildSvc,
		BuildTimeout: cfg.Build.GoBuildTimeout,
	}).Mount(apiv2Router)
	//server.NewAPIv2Handler(playgroundClient, buildSvc).Mount(apiv2Router)

	// Web UI routes
	tplVars := server.TemplateArguments{
		GoogleTagID: cfg.Services.GoogleAnalyticsID,
	}
	if tplVars.GoogleTagID != "" {
		if err := webutil.ValidateGTag(tplVars.GoogleTagID); err != nil {
			logger.Error("invalid GTag ID value, parameter will be ignored",
				zap.String("gtag", tplVars.GoogleTagID), zap.Error(err))
			tplVars.GoogleTagID = ""
		}
	}

	assetsDir := cfg.HTTP.AssetsDir
	indexHandler := server.NewTemplateFileServer(zap.L(), filepath.Join(assetsDir, server.IndexFileName), tplVars)
	spaHandler := server.NewSpaFileServer(assetsDir, tplVars)
	r.Path("/").
		Handler(indexHandler)
	r.Path("/snippet/{snippetID:[A-Za-z0-9_-]+}").
		Handler(indexHandler)
	r.PathPrefix("/").
		Handler(spaHandler)

	srv := &http.Server{
		Addr:         cfg.HTTP.Addr,
		Handler:      r,
		ReadTimeout:  cfg.HTTP.ReadTimeout,
		WriteTimeout: cfg.HTTP.WriteTimeout,
		IdleTimeout:  cfg.HTTP.IdleTimeout,
	}

	if err := startHttpServer(ctx, wg, srv); err != nil {
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
			if errors.Is(err, context.Canceled) {
				return
			}

			logger.Errorf("Could not gracefully shutdown the server: %v\n", err)
		}
	}()

	wg.Add(1)
	logger.Infof("Listening on %q", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("cannot start server on %q: %s", server.Addr, err)
	}

	return nil
}
