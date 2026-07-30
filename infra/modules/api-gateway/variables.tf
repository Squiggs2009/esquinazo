###############################################################################
# api-gateway - variables
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

variable "api_name" {
  description = "HTTP API name. Defaults to \"<project>-<environment>-api\"."
  type        = string
  default     = null
}

variable "api_description" {
  description = "HTTP API description."
  type        = string
  default     = null
}

###############################################################################
# Routes
###############################################################################

variable "routes" {
  description = <<-EOT
    Routes keyed by path (must start with "/"), each backed by a Lambda proxy
    integration. Pass the lambda module's outputs, e.g.

      routes = {
        "/fixtures"  = { lambda_function_name = module.lambda.function_names["fixtures"],  lambda_invoke_arn = module.lambda.invoke_arns["fixtures"] }
        "/standings" = { ... }
        "/players"   = { ... }
        "/transfers" = { ... }
      }

    Set methods to expose more than GET, e.g. ["GET", "POST"]. Use
    path = "/fixtures/{id}" style keys for parameterised routes.
  EOT
  type = map(object({
    lambda_function_name   = string
    lambda_invoke_arn      = string
    methods                = optional(list(string), ["GET"])
    payload_format_version = optional(string, "2.0")
    timeout_milliseconds   = optional(number, 29000)
    authorizer_id          = optional(string)
    authorization_type     = optional(string, "NONE")

    # Per-route throttling overrides; fall back to the stage defaults.
    throttling_rate_limit  = optional(number)
    throttling_burst_limit = optional(number)
  }))

  validation {
    condition     = alltrue([for path in keys(var.routes) : startswith(path, "/")])
    error_message = "Every route key must start with \"/\"."
  }
}

###############################################################################
# Stage / throttling
###############################################################################

variable "stage_name" {
  description = "Stage name. \"$default\" serves the API at the root path with no stage prefix."
  type        = string
  default     = "$default"
}

variable "auto_deploy" {
  description = "Automatically deploy changes to the stage."
  type        = bool
  default     = true
}

variable "throttling_rate_limit" {
  description = "Steady-state request rate limit (requests per second) across the stage."
  type        = number
  default     = 100
}

variable "throttling_burst_limit" {
  description = "Burst capacity for the stage throttle."
  type        = number
  default     = 200
}

variable "detailed_metrics_enabled" {
  description = "Enable per-route CloudWatch metrics (extra cost)."
  type        = bool
  default     = false
}

###############################################################################
# Access logging
###############################################################################

variable "access_logs_enabled" {
  description = "Send stage access logs to CloudWatch Logs."
  type        = bool
  default     = true
}

variable "access_logs_retention_days" {
  description = "Retention for the access log group."
  type        = number
  default     = 14
}

variable "access_log_format" {
  description = "Access log format (JSON string with $context variables)."
  type        = string
  default     = null
}

###############################################################################
# CORS
###############################################################################

variable "cors_enabled" {
  description = "Configure CORS on the API."
  type        = bool
  default     = true
}

variable "cors_allow_origins" {
  description = "Allowed origins. Set to the site's real origin(s) in production."
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  description = "Allowed HTTP methods."
  type        = list(string)
  default     = ["GET", "OPTIONS"]
}

variable "cors_allow_headers" {
  description = "Allowed request headers."
  type        = list(string)
  default     = ["content-type", "authorization"]
}

variable "cors_expose_headers" {
  description = "Response headers exposed to the browser."
  type        = list(string)
  default     = []
}

variable "cors_allow_credentials" {
  description = "Allow credentials. Cannot be combined with a \"*\" origin."
  type        = bool
  default     = false
}

variable "cors_max_age" {
  description = "Seconds a browser may cache the preflight response."
  type        = number
  default     = 300
}

###############################################################################
# Custom domain (optional)
###############################################################################

variable "domain_name" {
  description = "Optional custom domain for the API (e.g. api.esquinazo.io). Leave null to use the execute-api endpoint."
  type        = string
  default     = null
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for domain_name. MUST be in the same region as the API. Required when domain_name is set."
  type        = string
  default     = null
}

variable "domain_security_policy" {
  description = "Minimum TLS version for the custom domain."
  type        = string
  default     = "TLS_1_2"
}

variable "api_mapping_key" {
  description = "Optional base path for the API mapping (e.g. \"v1\"). Null maps the domain root."
  type        = string
  default     = null
}

###############################################################################
# Tags
###############################################################################

variable "tags" {
  description = "Additional tags merged over the module's default tags."
  type        = map(string)
  default     = {}
}
