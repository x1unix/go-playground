package testutil

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"
	"testing"
)

func GetLogger(t *testing.T) *zap.SugaredLogger {
	return zaptest.NewLogger(t).Sugar()
}
