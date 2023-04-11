package uihost

import (
	"context"
	"sync"

	"github.com/x1unix/go-playground/internal/gorepl/pacman"
	"golang.org/x/mod/module"
)

const eventBufferSize = 10

type pmEventType = uint8

const (
	pmEventEmpty pmEventType = iota
	pmEventDependencyCheckFinish
	pmEventDependencyResolveStart
	pmEventPackageSearchStart
	pmEventPackageDownload
	pmEventPackageExtract
)

type packageManagerEvent struct {
	eventType      pmEventType
	success        bool
	processedItems int
	totalItems     int
	context        string
}

var _ pacman.PMProgressObserver = (*PackageDownloadObserver)(nil)

// PackageDownloadObserver sends package manager events to web ui host.
type PackageDownloadObserver struct {
	ch   chan packageManagerEvent
	once sync.Once
}

func NewPackageDownloadObserver() *PackageDownloadObserver {
	observer := &PackageDownloadObserver{
		ch: make(chan packageManagerEvent, eventBufferSize),
	}

	return observer
}

// Start starts background events channel listener that sends events to web ui host.
func (o *PackageDownloadObserver) Start(ctx context.Context) {
	o.once.Do(func() {
		go o.handleEvents(ctx)
	})
}

func (o *PackageDownloadObserver) DependencyCheckFinish(err error) {
	var msg string
	if err != nil {
		msg = err.Error()
	}

	o.ch <- packageManagerEvent{
		eventType: pmEventDependencyCheckFinish,
		success:   err == nil,
		context:   msg,
	}
}

func (o *PackageDownloadObserver) DependencyResolveStart(packagesCount int) {
	o.ch <- packageManagerEvent{
		eventType:  pmEventDependencyResolveStart,
		totalItems: packagesCount,
	}
}

func (o *PackageDownloadObserver) PackageSearchStart(pkgName string) {
	o.ch <- packageManagerEvent{
		eventType: pmEventPackageSearchStart,
		context:   pkgName,
	}
}

func (o *PackageDownloadObserver) PackageDownload(pkg *module.Version, progress pacman.Progress) {
	o.ch <- packageManagerEvent{
		eventType:      pmEventPackageDownload,
		processedItems: progress.Current,
		totalItems:     progress.Total,
		context:        pkg.String(),
	}
}

func (o *PackageDownloadObserver) PackageExtract(pkg *module.Version, progress pacman.Progress) {
	o.ch <- packageManagerEvent{
		eventType:      pmEventPackageExtract,
		processedItems: progress.Current,
		totalItems:     progress.Total,
		context:        pkg.String(),
	}
}

func (o *PackageDownloadObserver) handleEvents(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			close(o.ch)
			return
		case event, ok := <-o.ch:
			if !ok {
				return
			}

			onPackageManagerEvent(event)
		}
	}
}
