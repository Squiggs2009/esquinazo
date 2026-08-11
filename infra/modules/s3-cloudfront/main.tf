###############################################################################
# s3-cloudfront
#
# Private S3 origin bucket fronted by a CloudFront distribution using an
# Origin Access Control (OAC). The bucket blocks all public access; only the
# distribution can read from it.
###############################################################################

locals {
  name_prefix = "${var.project}-${var.environment}"
  bucket_name = coalesce(var.bucket_name, "${local.name_prefix}-web")

  use_custom_domain = length(var.domain_names) > 0

  tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

###############################################################################
# Origin bucket
###############################################################################

resource "aws_s3_bucket" "this" {
  bucket        = local.bucket_name
  force_destroy = var.force_destroy

  tags = merge(local.tags, { Name = local.bucket_name })
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  count = var.versioning_enabled && var.noncurrent_version_expiration_days > 0 ? 1 : 0

  bucket = aws_s3_bucket.this.id

  rule {
    id     = "expire-noncurrent-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_version_expiration_days
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  depends_on = [aws_s3_bucket_versioning.this]
}

# Only the CloudFront distribution may read objects from the bucket.
data "aws_iam_policy_document" "bucket" {
  statement {
    sid     = "AllowCloudFrontOACRead"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    resources = ["${aws_s3_bucket.this.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id
  policy = data.aws_iam_policy_document.bucket.json

  depends_on = [aws_s3_bucket_public_access_block.this]
}

###############################################################################
# CloudFront
###############################################################################

resource "aws_cloudfront_origin_access_control" "this" {
  name                              = "${local.name_prefix}-oac"
  description                       = "OAC for ${local.bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "directory_index" {
  count = var.directory_index_rewrite ? 1 : 0

  name    = "${local.name_prefix}-directory-index"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrites directory paths to /index.html for the S3 REST origin"
  publish = true
  code    = file("${path.module}/functions/directory-index.js")
}

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  comment             = "${local.name_prefix} web distribution"
  price_class         = var.price_class
  default_root_object = var.default_root_object
  http_version        = var.http_version
  is_ipv6_enabled     = var.ipv6_enabled
  aliases             = var.domain_names
  web_acl_id          = var.web_acl_id

  origin {
    origin_id                = "s3-${local.bucket_name}"
    domain_name              = aws_s3_bucket.this.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  default_cache_behavior {
    target_origin_id = "s3-${local.bucket_name}"

    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = var.allowed_methods
    cached_methods         = var.cached_methods
    compress               = true

    cache_policy_id            = var.cache_policy_id
    response_headers_policy_id = var.response_headers_policy_id

    dynamic "function_association" {
      for_each = var.directory_index_rewrite ? [1] : []

      content {
        event_type   = "viewer-request"
        function_arn = aws_cloudfront_function.directory_index[0].arn
      }
    }
  }

  # Single-page app: let the client router handle unknown paths.
  dynamic "custom_error_response" {
    for_each = var.spa_fallback ? [403, 404] : []

    content {
      error_code            = custom_error_response.value
      response_code         = 200
      response_page_path    = "/${var.default_root_object}"
      error_caching_min_ttl = var.spa_fallback_ttl
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = local.use_custom_domain ? null : true
    acm_certificate_arn            = local.use_custom_domain ? var.acm_certificate_arn : null
    ssl_support_method             = local.use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = local.use_custom_domain ? var.minimum_protocol_version : null
  }

  tags = merge(local.tags, { Name = "${local.name_prefix}-web" })

  lifecycle {
    precondition {
      condition     = !local.use_custom_domain || var.acm_certificate_arn != null
      error_message = "acm_certificate_arn is required when domain_names is set (certificate must live in us-east-1)."
    }
  }
}
