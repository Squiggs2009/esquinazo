###############################################################################
# s3-cloudfront - variables
###############################################################################

variable "project" {
  description = "Project name, used for tagging and resource naming."
  type        = string
  default     = "esquinazo"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

###############################################################################
# S3
###############################################################################

variable "bucket_name" {
  description = "Name of the private origin bucket. Defaults to \"<project>-<environment>-web\". Must be globally unique."
  type        = string
  default     = null
}

variable "force_destroy" {
  description = "Allow Terraform to delete the bucket even when it still contains objects."
  type        = bool
  default     = false
}

variable "versioning_enabled" {
  description = "Enable object versioning on the origin bucket."
  type        = bool
  default     = true
}

variable "noncurrent_version_expiration_days" {
  description = "Delete noncurrent object versions after this many days. Set to 0 to disable the lifecycle rule."
  type        = number
  default     = 30
}

###############################################################################
# CloudFront
###############################################################################

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 covers NA + EU only (cheapest)."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class must be one of PriceClass_100, PriceClass_200, PriceClass_All."
  }
}

variable "default_root_object" {
  description = "Object returned for requests to the distribution root."
  type        = string
  default     = "index.html"
}

variable "spa_fallback" {
  description = "Rewrite 403/404 origin responses to the default root object with a 200 status (client-side routing)."
  type        = bool
  default     = true
}

variable "spa_fallback_ttl" {
  description = "Seconds CloudFront caches the SPA fallback response."
  type        = number
  default     = 10
}

variable "directory_index_rewrite" {
  description = <<-EOT
    Attach a viewer-request CloudFront Function that rewrites "/foo/" and
    extensionless "/foo" to "/foo/index.html".

    The origin is the S3 REST endpoint, which does no directory-index
    resolution: without this, an object at foo/index.html is reachable only at
    its literal /index.html URL and every clean URL falls through to
    spa_fallback. Paths whose last segment contains a dot are left alone, and
    anything that still misses falls back exactly as before, so client-side
    routes keep working.

    Defaults to false so existing distributions are unaffected until opted in.
  EOT
  type        = bool
  default     = false
}

variable "allowed_methods" {
  description = "HTTP methods CloudFront forwards to the origin."
  type        = list(string)
  default     = ["GET", "HEAD", "OPTIONS"]
}

variable "cached_methods" {
  description = "HTTP methods CloudFront caches responses for."
  type        = list(string)
  default     = ["GET", "HEAD"]
}

variable "cache_policy_id" {
  description = "Managed cache policy ID for the default behaviour. Defaults to the AWS managed CachingOptimized policy."
  type        = string
  default     = "658327ea-f89d-4fab-a63d-7e88639e58f6"
}

variable "response_headers_policy_id" {
  description = "Optional managed response headers policy ID (e.g. SecurityHeadersPolicy = 67f7725c-6f97-4210-82d7-5512b31e9d03)."
  type        = string
  default     = null
}

variable "http_version" {
  description = "Maximum HTTP version supported by the distribution."
  type        = string
  default     = "http2and3"
}

variable "ipv6_enabled" {
  description = "Enable IPv6 on the distribution."
  type        = bool
  default     = true
}

variable "web_acl_id" {
  description = "Optional AWS WAFv2 web ACL ARN (must be in us-east-1) to associate with the distribution."
  type        = string
  default     = null
}

variable "geo_restriction_type" {
  description = "Geo restriction type: none, whitelist or blacklist."
  type        = string
  default     = "none"
}

variable "geo_restriction_locations" {
  description = "ISO 3166-1-alpha-2 country codes used with geo_restriction_type."
  type        = list(string)
  default     = []
}

###############################################################################
# Custom domain (optional)
###############################################################################

variable "domain_names" {
  description = "Alternate domain names (CNAMEs) for the distribution. Leave empty to use the *.cloudfront.net domain only."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for domain_names. MUST be issued in us-east-1. Required when domain_names is non-empty."
  type        = string
  default     = null
}

variable "minimum_protocol_version" {
  description = "Minimum TLS version for viewer connections (only used with a custom certificate)."
  type        = string
  default     = "TLSv1.2_2021"
}

###############################################################################
# Tags
###############################################################################

variable "tags" {
  description = "Additional tags merged over the module's default tags."
  type        = map(string)
  default     = {}
}
