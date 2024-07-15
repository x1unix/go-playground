GO ?= go
UID ?= $(shell id -u)
GOROOT ?= $(shell go env GOROOT)
GOPATH ?= $(shell go env GOPATH)

PKG := ./cmd/playground
UI := ./web
TARGET := ./target

# App version
APP_VERSION ?= snapshot

# Debug mode
DEBUG ?= true

# Google Analytics ID (optional)
GTAG ?=

# API server listen address
LISTEN_ADDR := 127.0.0.1:8000

# Repository URL for issues.
REPO_URL := $(shell git remote get-url origin | sed -e 's/:/\//' -e 's/git@/https:\/\//' -e 's/\.git//')

.PHONY:all
all: build

include build.mk
include docker.mk

# Exports
export VITE_VERSION=$(APP_VERSION)
export VITE_GITHUB_URL=$(REPO_URL)
export VITE_WASM_API_VER=$(WASM_API_VER)
export VITE_WASM_BASE_URL=/wasm

.PHONY:run
run:
	@GOROOT=$(GOROOT) APP_SKIP_MOD_CLEANUP=true $(GO) run $(PKG) \
		-f ./data/packages.json \
		-static-dir="$(UI)/build" \
		-gtag-id="$(GTAG)" \
		-debug=$(DEBUG) \
		-addr $(LISTEN_ADDR) \
		$(EXTRA_ARGS)

.PHONY:ui
ui:
	@[ ! -d "$(UI)/node_modules" ] && yarn --cwd="$(UI)" install || true
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
