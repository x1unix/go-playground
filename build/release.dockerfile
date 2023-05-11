# This dockerfile is intended to run only by GitHub Actions
# for multi-arch builds.
#
# This Dockerfile builds only Go code, because building
# frontend twice for different platform takes too long
# inside VM and makes no sence.
#
# Use Dockerfile for simple single-arch build process

FROM golang:1.19-alpine as build
WORKDIR /tmp/playground
COPY cmd ./cmd
COPY pkg ./pkg
COPY internal ./internal
COPY go.mod .
COPY go.sum .
ARG APP_VERSION=1.0.0
RUN echo "Building server with version $APP_VERSION" && \
    go build -o server -ldflags="-X 'main.Version=$APP_VERSION'" ./cmd/playground && \
    GOOS=js GOARCH=wasm go build -o ./worker.wasm ./cmd/webworker && \
    GOOS=js GOARCH=wasm go build -o ./go-repl.wasm ./cmd/go-repl && \
    cp $(go env GOROOT)/misc/wasm/wasm_exec.js .

FROM golang:1.19-alpine as production
WORKDIR /opt/playground
ENV GOROOT /usr/local/go
ENV APP_CLEAN_INTERVAL=10m
ENV APP_DEBUG=false
ENV APP_PLAYGROUND_URL='https://go.dev/_'
ENV APP_GTAG_ID=''
COPY data ./data
COPY web/build ./public
COPY --from=build /tmp/playground/server .
COPY --from=build /tmp/playground/worker.wasm ./public
COPY --from=build /tmp/playground/go-repl.wasm ./public
COPY --from=build /tmp/playground/wasm_exec.js ./public
EXPOSE 8000
ENTRYPOINT /opt/playground/server \
    -f='/opt/playground/data/packages.json' \
    -addr=:8000
