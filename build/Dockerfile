FROM node:13-alpine as ui-build
COPY web .
RUN yarn install --silent && yarn build

FROM golang:1.13-alpine as build
COPY cmd ./cmd
COPY pkg ./pkg
COPY go.mod .
COPY go.sum .
RUN go build -o server ./cmd/playground

FROM golang:1.13-alpine as production
WORKDIR /opt/playground
COPY data ./data
COPY --from=ui-build web/build ./public
COPY --from=build server .
EXPOSE 8000
CMD ['/opt/playground/server', '-f=/opt/playground/data/packages.json']