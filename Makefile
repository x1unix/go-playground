PKG := ./cmd/playground
UI := ./web
TARGET := ./target
LISTEN_ADDR := 0.0.0.0:8000
DEBUG ?= true
GTAG ?=	# Set GTAG to enable Google Analytics

.PHONY:all
all: build

include build.mk
include docker.mk

.PHONY:run
run:
	@go run $(PKG) -f ./data/packages.json -debug=$(DEBUG) -addr $(LISTEN_ADDR)

.PHONY:ui
ui:
	@cd $(UI) && REACT_APP_LANG_SERVER=http://$(LISTEN_ADDR) REACT_APP_GTAG=$(GTAG) REACT_APP_VERSION=testing yarn start

