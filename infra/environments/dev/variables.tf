###############################################################################
# dev - variables
###############################################################################

variable "domain_name" {
  description = <<-EOT
    Apex domain for this environment. The sentinel "localhost" means "no custom
    domain": no Route 53 records, no CloudFront aliases and no API Gateway
    custom domain, so the stack is reachable only on its generated
    *.cloudfront.net and *.execute-api endpoints.
  EOT
  type        = string
  default     = "localhost"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for domain_name. When null the zone is looked up by name instead."
  type        = string
  default     = null
}

variable "environment" {
  description = "Environment name, used in resource names and the Environment tag."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for the regional resources (Lambda, DynamoDB, API Gateway)."
  type        = string
  default     = "us-east-1"
}

variable "api_football_key" {
  description = "API-Football (api-sports.io) key, injected into every Lambda."
  type        = string
  sensitive   = true
}

variable "news_api_key" {
  description = "API key for NewsAPI.org, injected only into the news Lambda (see local.news_function in main.tf)."
  type        = string
  sensitive   = true
}

variable "sanity_webhook_secret" {
  description = "Signing secret from the Sanity webhook, injected only into the generate-wire-page Lambda. Used to verify the sanity-webhook-signature header."
  type        = string
  sensitive   = true
}

variable "sanity_project_id" {
  description = "Sanity project id backing the Wire."
  type        = string
  default     = "jqhhqpia"
}

variable "sanity_dataset" {
  description = "Sanity dataset. Public on purpose - the Wire has to be crawlable - so no read token is needed."
  type        = string
  default     = "production"
}

variable "sanity_api_version" {
  description = "Sanity API version date used by the Wire queries."
  type        = string
  default     = "2024-01-01"
}

variable "tags" {
  description = "Additional tags merged over the default Project/Environment tags."
  type        = map(string)
  default     = {}
}

###############################################################################
# Certificates - required only when domain_name is not "localhost"
#
# CloudFront and API Gateway need certificates in different regions, so these
# are two separate ARNs even for the same domain.
###############################################################################

variable "cloudfront_certificate_arn" {
  description = "ACM certificate ARN covering <domain> and www.<domain>. MUST be issued in us-east-1."
  type        = string
  default     = null
}

variable "api_certificate_arn" {
  description = "ACM certificate ARN covering api.<domain>. MUST be issued in var.aws_region."
  type        = string
  default     = null
}

###############################################################################
# Application packaging
###############################################################################

variable "lambda_source_dir" {
  description = <<-EOT
    Directory holding one subdirectory of built Lambda code per function
    (fixtures/, standings/, players/, transfers/, refresh/). Relative paths are
    resolved from this directory. The build must exist before plan/apply -
    Terraform zips these directories itself.
  EOT
  type        = string
  default     = "../../../apps/api/dist"
}

variable "web_bucket_name" {
  description = "Override for the site bucket name. S3 names are globally unique; set this if the default is taken."
  type        = string
  default     = null
}

###############################################################################
# Tuning
###############################################################################

variable "refresh_schedule_expression" {
  description = "Schedule for the cache refresh Lambda."
  type        = string
  default     = "rate(5 minutes)"
}

variable "api_throttling_rate_limit" {
  description = "Steady-state request rate limit (requests per second) for the API stage."
  type        = number
  default     = 100
}

variable "api_throttling_burst_limit" {
  description = "Burst capacity for the API stage throttle."
  type        = number
  default     = 200
}

variable "cache_ttl_seconds" {
  description = "Default cache lifetime written to the expires_at attribute by the Lambdas."
  type        = number
  default     = 300
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention for the Lambdas and API access logs."
  type        = number
  default     = 14
}
