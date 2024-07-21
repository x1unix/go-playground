# Google Cloud Run Deployment

## Prerequisites

* [OpenTofu](https://opentofu.org) or Terraform.
* [gcloud](https://cloud.google.com/sdk/docs/install) tool.
* [Google Cloud](https://cloud.google.com/) project.

## Setup

* Initialize project using `tofu init` command.
* Copy `example.tfvars` to `prod.tfvars` and edit the file.
* Prepare Terraform plan using variables file: \
    `tofu plan -var-file="prod.tfvars" -out=tfplan`
* Apply a plan using `tofu apply tfplan` command.
