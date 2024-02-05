package builder

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/tevino/abool"
	"go.uber.org/zap"
)

type Cleaner interface {
	CleanJobName() string
	Clean(ctx context.Context) error
}

// CleanupDispatchService calls cleanup entries after periodical interval of time.
type CleanupDispatchService struct {
	isRunning abool.AtomicBool
	logger    *zap.Logger
	interval  time.Duration
	cleaners  []Cleaner
}

func NewCleanupDispatchService(logger *zap.Logger, interval time.Duration, cleaners ...Cleaner) *CleanupDispatchService {
	return &CleanupDispatchService{
		logger:   logger.Named("cleanup"),
		interval: interval,
		cleaners: cleaners,
	}
}

func (c *CleanupDispatchService) Start(ctx context.Context) {
	t := time.NewTicker(c.interval)
	defer t.Stop()

	c.logger.Info("started cleanup service", zap.Duration("interval", c.interval))
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			for _, cleaner := range c.cleaners {
				_ = cleaner.Clean(ctx)
			}
		}
	}
}

func (c *CleanupDispatchService) dispatchCleanup(ctx context.Context) {
	if c.isRunning.IsSet() {
		c.logger.Info("previous job not finished yet, skip")
		return
	}

	c.isRunning.Set()
	defer c.isRunning.UnSet()

	c.logger.Info("starting cleanup job")
	startTime := time.Now()
	jobCtx, cancelFn := context.WithTimeout(ctx, c.interval)
	defer cancelFn()

	wg := new(sync.WaitGroup)
	for _, cleaner := range c.cleaners {
		wg.Add(1)
		go func(cleaner Cleaner) {
			defer wg.Done()
			if err := cleaner.Clean(jobCtx); err != nil {
				if errors.Is(err, context.Canceled) {
					return
				}
				c.logger.Error(
					"cleaner returned an error",
					zap.Error(err), zap.String("cleaner", cleaner.CleanJobName()),
				)
			}
		}(cleaner)
	}

	wg.Wait()
	duration := time.Now().Sub(startTime)
	if duration > c.interval {
		c.logger.Warn("cleanup job took too long!", zap.Duration("duration", duration))
		return
	}
	c.logger.Info("cleanup job finished", zap.Duration("duration", duration))
}
