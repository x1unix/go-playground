terraform {
  required_version = "~> 1.5"

  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.38"
    }

    google = {
      source  = "hashicorp/google"
      version = "~> 5.38"
    }
  }
}