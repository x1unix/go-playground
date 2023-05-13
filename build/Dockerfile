FROM node:17-alpine as ui-build
COPY web /tmp/web
WORKDIR /tmp/web
ARG APP_VERSION=1.0.0
ARG GITHUB_URL='https://github.com/x1unix/go-playground'
RUN yarn install --silent && \
    REACT_APP_VERSION=$APP_VERSION \
    NODE_ENV=production \
    REACT_APP_GITHUB_URL=$GITHUB_URL \
    REACT_APP_GO_VERSION=$GO_VERSION \
    REACT_APP_PREV_GO_VERSION=$PREV_GO_VERSION \
    yarn build

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
    GOOS=js GOARCH=wasm go build -ldflags "-s -w" -trimpath -o ./go-repl.wasm ./cmd/go-repl && \
    GOOS=js GOARCH=wasm go build -ldflags "-s -w" -trimpath -o ./worker.wasm ./cmd/webworker && \
    cp $(go env GOROOT)/misc/wasm/wasm_exec.js .

FROM golang:1.19-alpine as production
WORKDIR /opt/playground
ENV GOROOT /usr/local/go
ENV APP_CLEAN_INTERVAL=10m
ENV APP_DEBUG=false
ENV APP_PLAYGROUND_URL='https://go.dev/_'
ENV APP_GTAG_ID=''
COPY data ./data
COPY --from=ui-build /tmp/web/build ./public
COPY --from=build /tmp/playground/server .
COPY --from=build /tmp/playground/worker.wasm ./public
COPY --from=build /tmp/playground/go-repl.wasm ./public
COPY --from=build /tmp/playground/wasm_exec.js ./public
EXPOSE 8000
ENTRYPOINT /opt/playground/server \
    -f='/opt/playground/data/packages.json' \
    -addr=:8000
