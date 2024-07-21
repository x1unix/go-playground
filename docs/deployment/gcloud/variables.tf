variable "project_id" {
  description = "GCP Project ID"
  type = string
}

variable "region" {
  description = "The region of the GCP project"
  type = string
}

variable "app_env" {
  description = "Deployment environment"
  type = string
}

variable "app_version" {
  description = "Better Go Playground application version"
  type = string
}

variable "sentry_dsn" {
  description = "Sentry DSN"
  type = string
  default = ""
}

variable "env_vars" {
  description = "key-value pair of custom environment variables."
  type = map(string)
  default = {}
}
