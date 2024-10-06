# This dockerfile is intended to run only by GitHub Actions
# for multi-arch builds.
#
# This Dockerfile builds only Go code, because building
# frontend twice for different platform takes too long
# inside VM and makes no sence.
#
# Use Dockerfile for simple single-arch build process

ARG GO_VERSION=1.21
ARG APP_VERSION=1.0.0
ARG WASM_API_VER=v2

FROM golang:${GO_VERSION}-alpine AS build
ARG GO_VERSION
ARG WASM_API_VER
ARG APP_VERSION
WORKDIR /tmp/playground
COPY cmd ./cmd
COPY pkg ./pkg
COPY internal ./internal
COPY go.mod .
COPY go.sum .

## wasm_exec.js files are left for backwards compatibility for old clients.
RUN echo "Building server with version $APP_VERSION" && \
    go build -o server -ldflags="-X 'main.Version=$APP_VERSION'" ./cmd/playground

FROM golang:${GO_VERSION}-alpine AS production
ARG GO_VERSION
ARG WASM_API_VER
WORKDIR /opt/playground
ENV GOROOT /usr/local/go
ENV APP_CLEAN_INTERVAL=10m
ENV APP_DEBUG=false
ENV APP_PLAYGROUND_URL='https://go.dev/_'
ENV APP_GTAG_ID=''
COPY data ./data
COPY web/build ./public
COPY --from=build /tmp/playground/server .
EXPOSE 8000
ENTRYPOINT /opt/playground/server \
    -f='/opt/playground/data/packages.json' \
    -addr=:8000
