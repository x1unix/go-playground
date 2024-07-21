# Deployment as systemd unit

> [!TIP]
> See [HACKING.md](../../../HACKING.md) for development documentation.

## Prerequisites

* GNU or BSD Make
* Git
* Go 1.22+
* [Node Version Manager](https://github.com/nvm-sh/nvm) or Node.js 20 (`lts/iron`)
* [Yarn](https://yarnpkg.com/) package manager.

## Building

Close and build this repository:

```shell
git clone https://github.com/x1unix/go-playground.git
cd go-playground
make
```

## Installation

After building the app, install application and systemd unit:

```shell
sudo make install
```

Check if service is running:

```shell
systemctl status better-go-playground.service
```
