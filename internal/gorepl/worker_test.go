package gorepl

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

func TestWorker_Evaluate(t *testing.T) {
	client := goproxy.NewClient(http.DefaultClient, "https://proxy.golang.org")
	sample := readTestdata(t, "sample.go.txt")
	ctx := context.Background()
	w := NewWorker(nil, client)
	err := w.checkNewImports(ctx, sample)
	require.NoError(t, err)
}

func TestParseFileImports(t *testing.T) {
	want := []string{
		"go.uber.org/zap",
		"golang.org/x/tools/internal/imports",
	}
	sample := readTestdata(t, "sample.go.txt")

	v, err := parseFileImports("sample.go.txt", "", sample)
	require.NoError(t, err)
	require.Equal(t, want, v)
}

func readTestdata(t *testing.T, name string) []byte {
	t.Helper()
	data, err := os.ReadFile(filepath.Join("testdata", name))
	require.NoError(t, err)
	return data
}
