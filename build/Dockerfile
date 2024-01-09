ARG NODE_VERSION=20
ARG GO_VERSION=1.21
ARG WASM_API_VER=v2
ARG APP_VERSION=1.0.0
ARG GITHUB_URL='https://github.com/x1unix/go-playground'
ARG PREV_GO_VERSION=1.19

FROM node:${NODE_VERSION}-alpine as ui-build
ARG APP_VERSION
ARG GITHUB_URL
ARG NODE_VERSION
ARG WASM_API_VER
ARG GO_VERSION
ARG PREV_GO_VERSION
COPY web /tmp/web
WORKDIR /tmp/web
RUN yarn install --silent && \
    REACT_APP_VERSION=$APP_VERSION \
    NODE_ENV=production \
    REACT_APP_GITHUB_URL=$GITHUB_URL \
    REACT_APP_GO_VERSION=$GO_VERSION \
    REACT_APP_PREV_GO_VERSION=$PREV_GO_VERSION \
    REACT_APP_WASM_API_VER=$WASM_API_VER \
    yarn build

FROM golang:${GO_VERSION}-alpine as build
ARG GO_VERSION
ARG APP_VERSION
ARG WASM_API_VER
WORKDIR /tmp/playground
COPY cmd ./cmd
COPY pkg ./pkg
COPY internal ./internal
COPY go.mod .
COPY go.sum .
RUN echo "Building server with version $APP_VERSION" && \
    go build -o server -ldflags="-X 'main.Version=$APP_VERSION'" ./cmd/playground && \
    GOOS=js GOARCH=wasm go build -ldflags "-s -w" -trimpath -o ./go-repl@$WASM_API_VER.wasm ./cmd/go-repl && \
    GOOS=js GOARCH=wasm go build -ldflags "-s -w" -trimpath -o ./worker@$WASM_API_VER.wasm ./cmd/webworker && \
    cp $(go env GOROOT)/misc/wasm/wasm_exec.js .

FROM golang:${GO_VERSION}-alpine as production
ARG GO_VERSION
ARG APP_VERSION
ARG WASM_API_VER
WORKDIR /opt/playground
ENV GOROOT /usr/local/go
ENV APP_CLEAN_INTERVAL=10m
ENV APP_DEBUG=false
ENV APP_PLAYGROUND_URL='https://go.dev/_'
ENV APP_GTAG_ID=''
COPY data ./data
COPY --from=ui-build /tmp/web/build ./public
COPY --from=build /tmp/playground/server .
COPY --from=build /tmp/playground/*.wasm ./public
COPY --from=build /tmp/playground/wasm_exec.js ./public
EXPOSE 8000
ENTRYPOINT /opt/playground/server \
    -f='/opt/playground/data/packages.json' \
    -addr=:8000
