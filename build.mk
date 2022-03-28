GO ?= go
YARN ?= yarn
GOROOT ?= $(shell go env GOROOT)
TOOLS ?= ./tools
PUBLIC_DIR ?= $(UI)/public
WEBWORKER_PKG ?= ./cmd/webworker

.PHONY: clean
clean:
	@echo ":: Cleanup..." && rm -rf $(TARGET) && rm -rf $(UI)/build

.PHONY:check-go
check-go:
	@if ! command -v $(GO) >/dev/null 2>&1 ; then\
		echo "ERROR: '$(GO)' binary not found. Please ensure that Go is installed or specify binary path with 'GO' variable." && \
		exit 1; \
	fi;

.PHONY:check-yarn
check-yarn:
	@if ! command -v $(YARN) >/dev/null 2>&1 ; then\
		echo "ERROR: '$(YARN)' binary not found. Please ensure that Node.js and Yarn are installed or specify binary path with 'YARN' variable." && \
		exit 1; \
	fi;

# Build targets
.PHONY: collect-meta
collect-meta:
	@echo ":: Building Go packages index..." && \
	$(GO) run $(TOOLS)/collector -goroot $(GOROOT) -out data/packages.json

.PHONY:preinstall
preinstall:
	@echo ":: Checking and installing dependencies..." && \
	cd $(UI) && $(YARN) install --silent

.PHONY:build-server
build-server:
	@echo ":: Building server..." && \
	$(GO) build -o $(TARGET)/playground $(PKG)

.PHONY:build-ui
build-ui:
	@echo ":: Building UI..." && \
	cd $(UI) && $(YARN) build

.PHONY:build-webworker
build-webworker:
	@echo ":: Building Go Webworker module..." && \
	GOOS=js GOARCH=wasm $(GO) build -o $(PUBLIC_DIR)/worker.wasm $(WEBWORKER_PKG) && \
	cp "$(GOROOT)/misc/wasm/wasm_exec.js" $(PUBLIC_DIR)

.PHONY: build
build: check-go check-yarn clean preinstall collect-meta build-server build-webworker build-ui
	@echo ":: Copying assets..." && \
	cp -rfv ./data $(TARGET)/data && \
	mv -v $(UI)/build $(TARGET)/public && \
	echo ":: Build done - $(TARGET)"
