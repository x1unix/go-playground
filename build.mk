GO ?= go
YARN ?= yarn
GOROOT ?= $(shell $(GO) env GOROOT)
TOOLS ?= ./tools
PUBLIC_DIR ?= $(UI)/public

MIN_GO_VERSION ?= 1.21
WASM_API_VER ?= $(shell cat ./cmd/wasm/api-version.txt)

define build_wasm_worker
	@echo ":: Building WebAssembly worker '$(1)' ..."
	GOOS=js GOARCH=wasm $(GO) build -buildvcs=false -ldflags "-s -w" -trimpath \
		$(2) -o $(PUBLIC_DIR)/wasm/$(1)@$(WASM_API_VER).wasm ./cmd/wasm/$(1)
endef

define check_tool
	@if ! command -v $(1) >/dev/null 2>&1 ; then\
		echo "ERROR: '$(1)' binary not found. Please ensure that tool is installed or specify binary path with '$(2)' variable." && \
		exit 1; \
	fi;
endef

.PHONY: clean
clean:
	@echo ":: Cleanup..." && rm -rf $(TARGET) && rm -rf $(UI)/build

.PHONY:check-go
check-go:
	$(call check_tool,$(GO),'GO')
	@if [ "$$(printf '%s\n' "$$($(GO) version)" $(MIN_GO_VERSION) | sort -V | head -n1)" != "1.21" ]; then \
		echo "Error: Go version should be $(MIN_GO_VERSION) or above"; \
		exit 1; \
	fi

.PHONY: pkg-index
pkg-index:
	@echo ":: Generating Go packages index..." && \
	$(GO) run ./tools/pkgindexer -o $(UI)/public/data/imports.json

.PHONY:check-yarn
check-yarn:
	$(call check_tool,$(YARN),'YARN')

# Build targets
.PHONY: collect-meta
collect-meta:
	@echo ":: Building Go packages index..." && \
	$(GO) run $(TOOLS)/collector -goroot $(GOROOT) -out data/packages.json

.PHONY:preinstall
preinstall:
	@echo ":: Checking and installing dependencies..." && \
	$(YARN) --cwd="$(UI)" install --silent

.PHONY:build-server
build-server:
	@echo ":: Building server..." && \
	$(GO) build -o $(TARGET)/playground $(PKG)

.PHONY:build-ui
build-ui:
	@echo ":: Building UI..." && \
	$(YARN) --cwd="$(UI)" build

.PHONY: wasm_exec.js
wasm_exec.js:
	@cp "$(GOROOT)/misc/wasm/wasm_exec.js" $(UI)/src/lib/go/wasm_exec.js

.PHONY:build-webworker
analyzer.wasm:
	$(call build_wasm_worker,analyzer)

.PHONY:wasm
wasm: wasm_exec.js analyzer.wasm 

.PHONY: build
build: check-go check-yarn clean preinstall gen collect-meta build-server wasm pkg-index build-ui 
	@echo ":: Copying assets..." && \
	cp -rfv ./data $(TARGET)/data && \
	mv -v $(UI)/build $(TARGET)/public && \
	echo ":: Build done - $(TARGET)"

.PHONY:gen
gen:
	@find . -name '*_gen.go' -exec go generate -v {} \;
