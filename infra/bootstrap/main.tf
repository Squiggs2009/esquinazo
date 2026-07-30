###############################################################################
# bootstrap
#
# Remote state backend for every other Esquinazo stack:
#   - a versioned, encrypted S3 bucket holding the state files
#   - a DynamoDB table providing state locking
#
# Both carry prevent_destroy: destroying them would orphan the state of every
# other stack.
###############################################################################

provider "aws" {
  region = var.aws_region
}

locals {
  tags = merge(
    {
      Project     = var.project_name
      Environment = "bootstrap"
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

###############################################################################
# Bucket name suffix
#
# S3 bucket names are globally unique across all AWS accounts, so the project
# name alone is not a safe choice. This suffix is generated once and then held
# in state for the life of the bucket.
###############################################################################

resource "random_string" "bucket_suffix" {
  length  = 8
  lower   = true
  upper   = false
  numeric = false
  special = false
}

###############################################################################
# State bucket
###############################################################################

resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-terraform-state-${random_string.bucket_suffix.result}"

  tags = merge(local.tags, { Name = "${var.project_name}-terraform-state" })

  lifecycle {
    prevent_destroy = true
  }
}

# State files hold the full history of the infrastructure - keep every version.
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Keep a month of superseded state versions for rollback, then let them go.
resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "expire-noncurrent-state-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  depends_on = [aws_s3_bucket_versioning.terraform_state]
}

###############################################################################
# State lock table
###############################################################################

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "${var.project_name}-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  # Locks are transient - there is nothing worth restoring to a point in time.
  point_in_time_recovery {
    enabled = false
  }

  tags = merge(local.tags, { Name = "${var.project_name}-terraform-locks" })

  lifecycle {
    prevent_destroy = true
  }
}
