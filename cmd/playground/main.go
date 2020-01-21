package main

import (
	"flag"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/x1unix/go-playground/pkg/analyzer"
	"github.com/x1unix/go-playground/pkg/langserver"
	"go.uber.org/zap"
	"log"
	"net/http"
	"os"
)

func main() {
	var packagesFile string
	var addr string
	var debug bool
	flag.StringVar(&packagesFile, "f", "packages.json", "Path to packages index JSON file")
	flag.StringVar(&addr, "addr", ":8080", "TCP Listen address")
	flag.BoolVar(&debug, "debug", false, "Enable debug mode")

	goRoot, ok := os.LookupEnv("GOROOT")
	if !ok {
		fmt.Println("environment variable GOROOT is not defined")
		os.Exit(1)
	}

	flag.Parse()
	l := getLogger(debug)
	defer l.Sync()
	if err := start(packagesFile, addr, goRoot, debug); err != nil {
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

func start(packagesFile, addr, goRoot string, debug bool) error {
	zap.S().Infof("GOROOT is %q", goRoot)
	zap.S().Infof("Packages file is %q", packagesFile)
	analyzer.SetRoot(goRoot)
	packages, err := analyzer.ReadPackagesFile(packagesFile)
	if err != nil {
		return fmt.Errorf("failed to read packages file %q: %s", packagesFile, err)
	}

	r := mux.NewRouter()
	langserver.New(packages).Mount(r.PathPrefix("/api").Subrouter())
	r.PathPrefix("/").Handler(langserver.SpaFileServer("./public"))

	zap.S().Infof("Listening on %q", addr)

	var handler http.Handler
	if debug {
		zap.S().Info("Debug mode enabled, CORS disabled")
		handler = langserver.NewCORSDisablerWrapper(r)
	} else {
		handler = r
	}

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}

	return nil
}
