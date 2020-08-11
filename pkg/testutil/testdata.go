package testutil

import (
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
)

func OpenTestdata(t *testing.T, fPath string) io.ReadWriteCloser {
	t.Helper()
	f, err := os.Open(filepath.Join("testdata", fPath))
	if err != nil {
		t.Fatalf("testdata: cannot open %q - %s", fPath, err)
	}

	return f
}

func ReadTestdata(t *testing.T, fPath string) []byte {
	t.Helper()
	data, err := ioutil.ReadAll(OpenTestdata(t, fPath))
	if err != nil {
		t.Fatalf("testdata: cannot read %q - %s", fPath, err)
	}

	return data
}

func TestdataPath(fPath string) string {
	return filepath.Join("testdata", fPath)
}
