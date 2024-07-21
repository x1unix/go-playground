# See: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_v2_service 

# Beta provider is required for "empty_dir" storage type.
provider "google-beta" {
  project = var.project_id
  region  = var.region
}

resource "google_cloud_run_v2_service" "default" {
  provider = google-beta
  name     = "gpg-${var.app_env}"
  location = var.region
  launch_stage = "BETA"

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 5
    }

    volumes {
      name = "gpg-build-cache-${var.app_env}"
      empty_dir {
        medium = "MEMORY"
        size_limit = "256Mi"
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

      env {
        name = "APP_LOG_FORMAT"
        value = "console"
      }

      # Disable cache cleanup for stateless containers.
      env {
        name = "APP_SKIP_MOD_CLEANUP"
        value = "1"
      }

      env {
        name = "SENTRY_ENVIRONMENT"
        value = var.app_env
      }

      env {
        name = "SENTRY_RELEASE"
        value = "v${var.app_version}"
      }

      env {
        name = "SENTRY_DSN"
        value = var.sentry_dsn
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name = env.key
          value = env.value
        }
      }

      # Use WASM build cache directory.
      env {
        name = "APP_BUILD_DIR"
        value = "/var/cache/wasm-builds"
      }

      volume_mounts {
        name = "gpg-build-cache-${var.app_env}"
        mount_path = "/var/cache/wasm-builds"
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
