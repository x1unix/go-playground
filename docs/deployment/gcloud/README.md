# Google Cloud Run Deployment

## Overview

This example provides a basic Terraform project to deploy the playground
on Google Cloud as a [Cloud Run](https://cloud.google.com/run?hl=en) app.

HCL defines:

* Cloud Run service with the app.
* Simple bucket with shared Go mod and WASM builds cache.
* IAM rules for a cache bucket.

## Prerequisites

* [Terraform](https://www.terraform.io/) or [OpenTofu](https://opentofu.org).
* [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install).
* [Google Cloud](https://cloud.google.com/) project.

## Deployment

### First-time setup

Initialize a Terraform project and prepare a TF variables file:

```shell
# Auth on gcloud and init TF project.
# This action should be called only once.
make init

# Create a var file from a template
# and fill it with correct values:
cp example.tfvars prod.tfvars
vim prod.tfvars
```

### App Configuration

See environment variables section in [Docker](../docker/README.md) docs.

### Deploying changes

```shell
# Prepare a Terraform plan
make plan

# Apply a plan
make apply
```

### Destroying a deployment

```shell
make destroy
```