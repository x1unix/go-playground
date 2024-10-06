ARG NODE_VERSION=20
ARG GO_VERSION=1.21
ARG WASM_API_VER=v2
ARG APP_VERSION=1.0.0
ARG GITHUB_URL='https://github.com/x1unix/go-playground'
ARG PREV_GO_VERSION=1.19

FROM node:${NODE_VERSION}-alpine AS ui-build
ARG APP_VERSION
ARG GITHUB_URL
ARG NODE_VERSION
ARG WASM_API_VER
ARG GO_VERSION
ARG PREV_GO_VERSION
COPY web /tmp/web
WORKDIR /tmp/web
RUN yarn install --silent && \
    VITE_VERSION=$APP_VERSION \
    NODE_ENV=production \
    VITE_GITHUB_URL=$GITHUB_URL \
    VITE_GO_VERSION=$GO_VERSION \
    VITE_PREV_GO_VERSION=$PREV_GO_VERSION \
    VITE_WASM_API_VER=$WASM_API_VER \
    VITE_WASM_BASE_URL=/wasm \
    yarn build

FROM golang:${GO_VERSION}-alpine AS build
ARG GO_VERSION
ARG APP_VERSION
ARG WASM_API_VER
WORKDIR /tmp/playground
COPY cmd ./cmd
COPY pkg ./pkg
COPY internal ./internal
COPY tools ./tools
COPY go.mod .
COPY go.sum .

## wasm_exec.js files are left for backwards compatibility for old clients.
RUN echo "Building server with version $APP_VERSION" && \
    go build -o server -ldflags="-X 'main.Version=$APP_VERSION'" ./cmd/playground && \
    GOOS=js GOARCH=wasm go build \
    -buildvcs=false \
    -ldflags "-s -w" \
    -trimpath \
    -o ./analyzer@$WASM_API_VER.wasm ./cmd/wasm/analyzer && \
    go run ./tools/pkgindexer imports -o ./data/imports.json && \
    go run ./tools/pkgindexer index -o ./data/go-index.json

FROM golang:${GO_VERSION}-alpine AS production
ARG GO_VERSION
ARG APP_VERSION
ARG WASM_API_VER
WORKDIR /opt/playground
ENV GOROOT=/usr/local/go
ENV APP_CLEAN_INTERVAL=10m
ENV APP_DEBUG=false
ENV APP_PLAYGROUND_URL='https://go.dev/_'
ENV APP_GTAG_ID=''
COPY --from=ui-build /tmp/web/build ./public
COPY --from=build /tmp/playground/server .
COPY --from=build /tmp/playground/*.wasm ./public/wasm/
COPY --from=build /tmp/playground/*.js ./public/wasm/
COPY --from=build /tmp/playground/data ./public/data
EXPOSE 8000
ENTRYPOINT /opt/playground/server \
    -addr=:8000
