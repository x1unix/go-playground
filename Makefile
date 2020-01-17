PKG := ./cmd/server

.PHONY:run
run:
	@go run $(PKG) -f ./data/packages.json -debug

.PHONY: collect-meta
collect-meta:
	@node ./bin/collector

