# Google Cloud Run Deployment

## Prerequisites

* [Terraform](https://www.terraform.io/) or [OpenTofu](https://opentofu.org).
* [gcloud](https://cloud.google.com/sdk/docs/install) tool.
* [Google Cloud](https://cloud.google.com/) project.

## Setup

* Initialize project using `terraform init` command.
* Copy `example.tfvars` to `prod.tfvars` and edit the file.
* Prepare Terraform plan using variables file: \
    `terraform plan -var-file="prod.tfvars" -out=tfplan`
* Apply a plan using `terraform apply tfplan` command.

## Configuration

See environment variables section in [Docker](../docker/README.md) docs.
