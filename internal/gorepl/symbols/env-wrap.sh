#!/bin/sh

rm go1_*.go

# Run any incoming program with wasm/js env vars
GOOS=js GOARCH=wasm $@

# Update build constraints
find . -name 'go1_*.go' -exec sed -i '' 's/^\/\/go:build go1\.\([0-9]*\)/\/\/go:build go1.\1 \&\& js/g' {} \;
find . -name 'go1_*.go' -exec sed -i '' 's/^\/\/ *+build go1\.\([0-9]*\)/\/\/+build go1.\1,js/g' {} \;