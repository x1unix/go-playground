GO ?= go
GOROOT ?= $(shell go env GOROOT)
TOOLS ?= ./tools
PUBLIC_DIR ?= $(UI)/public
WEBWORKER_PKG ?= ./cmd/webworker

.PHONY: clean
clean:
	@echo ":: Cleanup..." && rm -rf $(TARGET) && rm -rf $(UI)/build

# Build targets
.PHONY: collect-meta
collect-meta:
	@echo ":: Building Go packages index..." && \
	$(GO) run $(TOOLS)/collector -goroot $(GOROOT) -out data/packages.json

.PHONY:preinstall
preinstall:
	@echo ":: Checking and installing dependencies..." && \
	cd $(UI) && yarn install --silent

.PHONY:build-server
build-server:
	@echo ":: Building server..." && \
	go build -o $(TARGET)/playground $(PKG)

.PHONY:build-ui
build-ui:
	@echo ":: Building UI..." && \
	cd $(UI) && yarn build

.PHONY:build-webworker
build-webworker:
	@echo ":: Building Go Webworker module..." && \
	GOOS=js GOARCH=wasm $(GO) build -o $(PUBLIC_DIR)/worker.wasm $(WEBWORKER_PKG) && \
	cp "$(GOROOT)/misc/wasm/wasm_exec.js" $(PUBLIC_DIR)

.PHONY: build
build: clean preinstall collect-meta build-server build-webworker build-ui
	@echo ":: Copying assets..." && \
	cp -rfv ./data $(TARGET)/data && \
	mv -v $(UI)/build $(TARGET)/public && \
	echo ":: Build done - $(TARGET)"
