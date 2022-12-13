GO ?= go
GOPATH ?= $(shell $(GO) env GOPATH)
FLATC ?= flatc

.PHONY: all js go flatc
all: go js

js:
	@node test_import.mjs

go:
	cd testmod && GOOS=js GOARCH=wasm go build -o main.wasm .

# supports --proto!!
flatc:
	$(FLATC) -g \
	--gen-object-api \
	--grpc \
	-o ./testmod \
	idl/*.fbs