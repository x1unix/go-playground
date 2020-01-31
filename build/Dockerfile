FROM node:13-alpine as ui-build
COPY web /tmp/web
WORKDIR /tmp/web
ARG APP_VERSION=1.0.0
ARG GITHUB_URL=https://github.com/x1unix/go-playground
RUN yarn install --silent && REACT_APP_VERSION=$APP_VERSION REACT_APP_GITHUB_URL=$GITHUB_URL yarn build

FROM golang:1.13-alpine as build
WORKDIR /tmp/playground
COPY cmd ./cmd
COPY pkg ./pkg
COPY go.mod .
COPY go.sum .
RUN go build -o server ./cmd/playground && \
    GOOS=js GOARCH=wasm go build -o ./worker.wasm ./cmd/webworker && \
    cp $(go env GOROOT)/misc/wasm/wasm_exec.js .

FROM golang:1.13-alpine as production
WORKDIR /opt/playground
ENV GOROOT /usr/local/go
ENV APP_CLEAN_INTERVAL=10m
ENV APP_DEBUG=false
COPY data ./data
COPY --from=ui-build /tmp/web/build ./public
COPY --from=build /tmp/playground/server .
COPY --from=build /tmp/playground/worker.wasm ./public
COPY --from=build /tmp/playground/wasm_exec.js ./public
EXPOSE 8000
ENTRYPOINT /opt/playground/server -f=/opt/playground/data/packages.json -addr=:8000 -clean-interval=${APP_CLEAN_INTERVAL} -debug=${APP_DEBUG}