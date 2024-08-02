# Deployment using docker-compose

## Using prebuilt image

Prebuilt Docker image is available on [Docker Hub](https://hub.docker.com/r/x1unix/go-playground) and [GitHub Container Registry](https://github.com/x1unix/go-playground/pkgs/container/go-playground%2Fgo-playground)

### Starting container

Download the [compose.yaml](./compose.yaml) file and run `docker-compose` to bootstrap the service:

```shell
# Create container and start the service.
docker-compose up -d

# Ensure that service is running.
docker-compose ps
```

### Environment variables

Playground server can be configured using environment variables described below.

| Environment Variable   | Example                        | Description                                                                                      |
|------------------------|--------------------------------|--------------------------------------------------------------------------------------------------|
| `GOROOT`               | `/usr/local/go`                | Go root location. Uses `go env GOROOT` as fallback.                                              |
| `APP_DEBUG`            | `false`                        | Enables debug logging.                                                                           |
| `APP_LOG_LEVEL`        | `info`                         | Logger log level. `debug` requires `APP_DEBUG` env var.                                          |
| `APP_LOG_FORMAT`       | `console`, `json`              | Log format                                                                                       | 
| `APP_PLAYGROUND_URL`   | `https://play.golang.org`      | Official Go playground service URL.                                                              |
| `APP_GOTIP_URL`        | `https://gotipplay.golang.org` | GoTip playground service URL.                                                                    |
| `APP_BUILD_DIR`        | `/var/cache/wasm`              | Path to store cached WebAssembly builds.                                                         |
| `APP_CLEAN_INTERVAL`   | `10m`                          | WebAssembly build files cache cleanup interval.                                                  |
| `APP_SKIP_MOD_CLEANUP` | `1`                            | Disables WASM builds cache cleanup.                                                              |
| `APP_PERMIT_ENV_VARS`  | `GOSUMDB,GOPROXY`              | Restricts list of environment variables passed to Go compiler.                                   |
| `APP_GO_BUILD_TIMEOUT` | `40s`                          | Go WebAssembly program build timeout. Includes dependency download process via `go mod download` |
| `HTTP_READ_TIMEOUT`    | `15s`                          | HTTP request read timeout.                                                                       |
| `HTTP_WRITE_TIMEOUT`   | `60s`                          | HTTP response timeout.                                                                           |
| `HTTP_IDLE_TIMEOUT`    | `90s`                          | HTTP keep alive timeout.                                                                         |

## Building custom image

Use **make** to build Docker image from sources:

```shell
make docker [...params]
```

### Required params

| Parameter     | Description                |
|---------------|----------------------------|
| `TAG`         | Image tag (version)        |
| `DOCKER_USER` | Docker repository user     |
| `DOCKER_PASS` | Docker repository password |

### Optional params

| Parameter  | Defaults               | Description         |
|------------|------------------------|---------------------|
| `IMG_NAME` | `x1unix/go-playground` | Image tag (version) |
