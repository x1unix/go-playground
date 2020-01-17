PKG := ./cmd/server
LISTEN_ADDR := 0.0.0.0:8000
DEBUG ?= true
.PHONY:run
run:
	@go run $(PKG) -f ./data/packages.json -debug=$(DEBUG) -addr $(LISTEN_ADDR)

.PHONY: collect-meta
collect-meta:
	@node ./bin/collector

.PHONY:ui
ui:
	@cd ./ui && REACT_APP_LANG_SERVER=http://$(LISTEN_ADDR) yarn start

