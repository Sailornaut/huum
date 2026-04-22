# ============================================================
# HUUM MVP — GCP Infrastructure (Terraform)
# ============================================================
# Cost-conscious setup using Cloud Run (scale-to-zero),
# Cloud SQL (smallest tier), and Cloud Storage.
#
# Usage:
#   cd infra/terraform
#   terraform init
#   terraform plan -var-file="terraform.tfvars"
#   terraform apply -var-file="terraform.tfvars"
# ============================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Uncomment to use remote state (recommended for team/prod)
  # backend "gcs" {
  #   bucket = "huum-terraform-state"
  #   prefix = "terraform/state"
  # }
}

# ============================================================
# Variables
# ============================================================
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "db_password" {
  description = "PostgreSQL root password"
  type        = string
  sensitive   = true
}

variable "api_image" {
  description = "Container image for the API (e.g., gcr.io/project/huum-api:latest)"
  type        = string
  default     = "gcr.io/cloudrun/placeholder"
}

variable "web_image" {
  description = "Container image for the web app"
  type        = string
  default     = "gcr.io/cloudrun/placeholder"
}

# ============================================================
# Provider
# ============================================================
provider "google" {
  project = var.project_id
  region  = var.region
}

# ============================================================
# Enable APIs
# ============================================================
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "compute.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# ============================================================
# VPC Network (for Cloud SQL private IP)
# ============================================================
resource "google_compute_network" "vpc" {
  name                    = "huum-vpc-${var.environment}"
  auto_create_subnetworks = true
}

resource "google_compute_global_address" "private_ip" {
  name          = "huum-db-ip-${var.environment}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip.name]
}

# ============================================================
# Cloud SQL — PostgreSQL
# ============================================================
resource "google_sql_database_instance" "postgres" {
  name             = "huum-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  depends_on = [google_service_networking_connection.private_vpc]

  settings {
    tier              = var.environment == "prod" ? "db-custom-2-4096" : "db-f1-micro"
    availability_type = var.environment == "prod" ? "REGIONAL" : "ZONAL"

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = var.environment == "prod"
}

resource "google_sql_database" "huum" {
  name     = "huum"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "huum" {
  name     = "huum_app"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# ============================================================
# Cloud Storage — Media uploads
# ============================================================
resource "google_storage_bucket" "media" {
  name          = "huum-media-${var.project_id}-${var.environment}"
  location      = var.region
  force_destroy = var.environment != "prod"

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "PUT", "POST"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}

# ============================================================
# Artifact Registry — Container images
# ============================================================
resource "google_artifact_registry_repository" "containers" {
  location      = var.region
  repository_id = "huum-${var.environment}"
  format        = "DOCKER"
}

# ============================================================
# Service Account for Cloud Run
# ============================================================
resource "google_service_account" "cloud_run" {
  account_id   = "huum-run-${var.environment}"
  display_name = "HUUM Cloud Run Service Account"
}

resource "google_project_iam_member" "cloud_run_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_storage_bucket_iam_member" "cloud_run_storage" {
  bucket = google_storage_bucket.media.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

# ============================================================
# Cloud Run — API
# ============================================================
resource "google_cloud_run_v2_service" "api" {
  name     = "huum-api-${var.environment}"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 10 : 3
    }

    containers {
      image = var.api_image

      ports {
        container_port = 3001
      }

      env {
        name  = "NODE_ENV"
        value = var.environment == "prod" ? "production" : "development"
      }
      env {
        name  = "DB_HOST"
        value = google_sql_database_instance.postgres.private_ip_address
      }
      env {
        name  = "DB_NAME"
        value = "huum"
      }
      env {
        name  = "DB_USER"
        value = "huum_app"
      }
      env {
        name  = "MEDIA_BUCKET"
        value = google_storage_bucket.media.name
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    vpc_access {
      network_interfaces {
        network = google_compute_network.vpc.name
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# ============================================================
# Cloud Run — Web (Next.js)
# ============================================================
resource "google_cloud_run_v2_service" "web" {
  name     = "huum-web-${var.environment}"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 10 : 3
    }

    containers {
      image = var.web_image

      ports {
        container_port = 3000
      }

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloud_run_v2_service.api.uri
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# ============================================================
# Make Cloud Run services publicly accessible
# ============================================================
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  name     = google_cloud_run_v2_service.api.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  name     = google_cloud_run_v2_service.web.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ============================================================
# Outputs
# ============================================================
output "api_url" {
  value = google_cloud_run_v2_service.api.uri
}

output "web_url" {
  value = google_cloud_run_v2_service.web.uri
}

output "db_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "db_private_ip" {
  value = google_sql_database_instance.postgres.private_ip_address
}

output "media_bucket" {
  value = google_storage_bucket.media.name
}

output "artifact_registry" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}"
}
