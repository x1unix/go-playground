provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_cloud_run_v2_service" "default" {
  name     = "gpg-${var.app_env}"
  location = var.region

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
        container_port = 8000
      }

      resources = {
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

      env {
        name = "APP_BUILD_DIR"
        value = "/var/cache/wasm-builds"
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          key = env.key
          value = env.value
        }
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
        period_seconds        = 10
        timeout_seconds       = 5
        success_threshold     = 1
        failure_threshold     = 3
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_project_iam_member" "run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "allUsers"
}

output "url" {
  value = google_cloud_run_v2_service.default.status[0].url
}
