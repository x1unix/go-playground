# Beta provider is required for "gcs" storage type.
provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# By default, TF will keep infra state in '*.tfstate' files.
# Uncomment this block if you with to keep TF state in a storage bucket:
#terraform {
#  backend "gcs" {
#    bucket = "<YOUR BUCKET NAME>"
#    prefix = "tfstates"
#  }
#}

locals {
  cache_bucket_name = "gpg-build-cache-${var.app_env}"
  cache_bucket_mount = "/mnt/gpg-build-cache-${var.app_env}"
  service_account_id = "gpg-svc-acc-${var.app_env}"
}

# Service account to access playground's cache bucket.
#
# See: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/google_service_account
resource "google_service_account" "run_sa" {
  account_id   = local.service_account_id
  project = var.project_id
  display_name = "Service Account for a Better Go Playground (${var.app_env})"
}

# Bucket to keep cached WASM builds and downloaded Go modules.
#
# See: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/storage_bucket
resource "google_storage_bucket" "static" {
  project = var.project_id
  location = var.region
  name = local.cache_bucket_name
  public_access_prevention = "enforced"

  # Truncate Go module cache policy
  lifecycle_rule {
    condition {
      age = 14
      matches_prefix = ["mod/"]
    }

    action {
      type = "Delete"
    }
  }

  # Truncate WASM builds cache policy
  lifecycle_rule {
    condition {
      age = 7
      matches_prefix = ["builds/"]
    }

    action {
      type = "Delete"
    }
  }

  # Truncate incomplete uploads
  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type = "AbortIncompleteMultipartUpload"
    }
  }
}

# IAM rule to grant access for a cache bucket.
#
# See: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/storage_bucket_iam
resource "google_storage_bucket_iam_binding" "bucket_access" {
  bucket = google_storage_bucket.static.name
  role   = "roles/storage.objectAdmin"
  members = [
    "serviceAccount:${google_service_account.run_sa.email}"
  ]
}

# The app service.
#
# See: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_v2_service 
resource "google_cloud_run_v2_service" "default" {
  provider = google-beta
  name     = "gpg-${var.app_env}"
  location = var.region
  launch_stage = "BETA"

  template {
    # Use service account with cache bucket access
    service_account = google_service_account.run_sa.email

    scaling {
      min_instance_count = 1
      max_instance_count = 5
    }

    volumes {
      name = local.cache_bucket_name
      gcs {
        bucket = local.cache_bucket_name
      }
    }

    containers {
      image = "x1unix/go-playground:${var.app_version}"
      ports {
        name = "http1"
        container_port = 8000
      }

      resources {
        cpu_idle = true
        startup_cpu_boost = false
        limits = {
          cpu = "1"
          memory = "512Mi"
        }
      }

      # Use the cache bucket for WASM builds and Go modules.
      volume_mounts {
        name = local.cache_bucket_name
        mount_path = local.cache_bucket_mount
      }

      env {
        name = "APP_BUILD_DIR"
        value = "${local.cache_bucket_mount}/builds"
      }

      env {
        name = "GOMODCACHE"
        value = "${local.cache_bucket_mount}/mod"
      }

      # Logging
      env {
        name = "APP_LOG_FORMAT"
        value = "console"
      }

      # Disable cache cleanup for stateless containers.
      env {
        name = "APP_SKIP_MOD_CLEANUP"
        value = "1"
      }

      # Uncomment this if you're using Sentry.
      # env {
      #   name = "SENTRY_ENVIRONMENT"
      #   value = var.app_env
      # }

      # env {
      #   name = "SENTRY_RELEASE"
      #   value = "v${var.app_version}"
      # }

      # env {
      #   name = "SENTRY_DSN"
      #   value = var.sentry_dsn
      # }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name = env.key
          value = env.value
        }
      }

      startup_probe {
        http_get {
          path = "/api/version"
          port = 8000
        }
        initial_delay_seconds = 10
        period_seconds = 10
        timeout_seconds = 5
        failure_threshold = 3
      }
    }
  }

  traffic {
    percent = 100
    type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

# Make service public.
# See: https://cloud.google.com/run/docs/authenticating/public
resource "google_cloud_run_service_iam_binding" "run_invoker" {
  project  = google_cloud_run_v2_service.default.project
  location = google_cloud_run_v2_service.default.location
  service  = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  members = [
    "allUsers"
  ]
}

output "url" {
  value = google_cloud_run_v2_service.default.uri
}
