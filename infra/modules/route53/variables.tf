###############################################################################
# route53 - variables
###############################################################################

variable "domain_name" {
  description = <<-EOT
    Apex domain for the site (e.g. esquinazo.io). The sentinel value
    "localhost" disables this module entirely, so local/dev stacks can run
    without a hosted zone.
  EOT
  type        = string
  default     = "localhost"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

###############################################################################
# CloudFront target
###############################################################################

variable "cloudfront_domain" {
  description = "CloudFront distribution domain name (*.cloudfront.net) for the apex alias records."
  type        = string
  default     = null
}

variable "cloudfront_zone_id" {
  description = "CloudFront hosted zone ID for the alias records."
  type        = string
  default     = null
}

###############################################################################
# API Gateway target
###############################################################################

variable "api_gateway_domain" {
  description = <<-EOT
    Regional target domain of the API Gateway custom domain
    (e.g. d-abc123.execute-api.us-east-1.amazonaws.com) - NOT the friendly
    api.<domain> name. Pass the api-gateway module's custom_domain_target
    output. Leave null to skip the api record.
  EOT
  type        = string
  default     = null
}

variable "api_subdomain" {
  description = "Subdomain label pointing at the API."
  type        = string
  default     = "api"
}

###############################################################################
# Record toggles
#
# These gate `count`, so they must be plain plan-time booleans - the module
# cannot infer them from the target domains, which are typically unknown until
# apply.
###############################################################################

variable "create_apex_records" {
  description = "Create the apex A/AAAA alias records pointing at CloudFront. Requires cloudfront_domain and cloudfront_zone_id."
  type        = bool
  default     = true
}

variable "create_www_record" {
  description = "Create the www CNAME pointing at the apex domain."
  type        = bool
  default     = true
}

variable "create_api_record" {
  description = "Create the api CNAME pointing at the API Gateway domain. Requires api_gateway_domain."
  type        = bool
  default     = true
}

variable "www_subdomain" {
  description = "Subdomain label pointing at the apex domain."
  type        = string
  default     = "www"
}

variable "record_ttl" {
  description = "TTL in seconds for the non-alias CNAME records."
  type        = number
  default     = 300
}

variable "hosted_zone_id" {
  description = <<-EOT
    Hosted zone ID to write records into. When null the zone is looked up by
    domain_name with a data source instead.

    Must be known at plan time, since it selects whether that data source runs.
    A literal, a tfvars value or another module's output is fine.
  EOT
  type        = string
  default     = null
}

variable "private_zone" {
  description = "Whether to look up a private hosted zone. Ignored when hosted_zone_id is set."
  type        = bool
  default     = false
}

###############################################################################
# Tags
#
# Route 53 record sets are not taggable resources; this variable is accepted
# for interface consistency with the other modules and is intentionally unused.
###############################################################################

variable "tags" {
  description = "Accepted for interface consistency. Route 53 records cannot be tagged."
  type        = map(string)
  default     = {}
}

variable "project" {
  description = "Project name. Accepted for interface consistency."
  type        = string
  default     = "esquinazo"
}
