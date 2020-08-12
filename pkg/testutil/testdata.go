package testutil

import (
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
)

// OpenTestdata returns opened file from testdata
func OpenTestdata(t *testing.T, fPath string) io.ReadWriteCloser {
	t.Helper()
	f, err := os.Open(filepath.Join("testdata", fPath))
	if err != nil {
		t.Fatalf("testdata: cannot open %q - %s", fPath, err)
	}

	return f
}

// ReadTestdata reads testdata file
func ReadTestdata(t *testing.T, fPath string) []byte {
	t.Helper()
	data, err := ioutil.ReadAll(OpenTestdata(t, fPath))
	if err != nil {
		t.Fatalf("testdata: cannot read %q - %s", fPath, err)
	}

	return data
}

// TestdataPath returns file path from testdata
func TestdataPath(fPath string) string {
	return filepath.Join("testdata", fPath)
}
