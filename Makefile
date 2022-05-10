GO ?= go
UID ?= $(shell id -u)
GOROOT ?= $(shell go env GOROOT)
GOPATH ?= $(shell go env GOPATH)

PKG := ./cmd/playground
UI := ./web
TARGET := ./target
DEBUG ?= true
GTAG ?=	# Set GTAG to enable Google Analytics
LISTEN_ADDR := 127.0.0.1:8000

.PHONY:all
all: build

include build.mk
include docker.mk

.PHONY:run
run:
	@GOROOT=$(GOROOT) $(GO) run $(PKG) \
		-f ./data/packages.json \
		-static-dir="$(UI)/build" \
		-gtag-id="$(GTAG)" \
		-debug=$(DEBUG) \
		-addr $(LISTEN_ADDR) \
		$(EXTRA_ARGS)

.PHONY:ui
ui:
	@LISTEN_ADDR=$(LISTEN_ADDR) yarn --cwd="$(UI)" start

.PHONY: cover
cover:
	@cat tools/cover.txt | xargs go test -v -covermode=count -coverprofile=/tmp/cover.out && \
	go tool cover -html=/tmp/cover.out

.PHONY: install
install:
	@if [ ! -d "./target" ]; then echo "ERROR: Please build project first by calling 'make'." && exit 2; fi
	@if [ "$(UID)" -ne "0" ]; then echo "ERROR: you cannot perform this operation unless you are root." && exit 3; fi
	@$(SHELL) ./build/install.sh
