GO ?= go
YARN ?= yarn
GOROOT ?= $(shell $(GO) env GOROOT)
TOOLS ?= ./tools
PUBLIC_DIR ?= $(UI)/public

MIN_GO_VERSION ?= 1.21
WASM_API_VER ?= v2

define build_wasm_worker
	@echo ":: Building WebAssembly worker '$(1)' ..."
	GOOS=js GOARCH=wasm $(GO) build -ldflags "-s -w" -trimpath \
		$(3) -o $(PUBLIC_DIR)/$(2)@$(WASM_API_VER).wasm $(1)
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

.PHONY:copy-wasm-exec
copy-wasm-exec:
	@cp "$(GOROOT)/misc/wasm/wasm_exec.js" $(PUBLIC_DIR)

.PHONY:build-webworker
build-webworker:
	$(call build_wasm_worker,./cmd/webworker,worker)

.PHONY:go-repl
go-repl:
	$(call build_wasm_worker,./cmd/go-repl,go-repl)

.PHONY:build-wasm
build-wasm: copy-wasm-exec build-webworker go-repl

.PHONY: build
build: check-go check-yarn clean preinstall collect-meta build-server build-wasm build-ui
	@echo ":: Copying assets..." && \
	cp -rfv ./data $(TARGET)/data && \
	mv -v $(UI)/build $(TARGET)/public && \
	echo ":: Build done - $(TARGET)"

.PHONY:gen
gen:
	@find . -name '*_gen.go' -exec go generate -v {} \;
