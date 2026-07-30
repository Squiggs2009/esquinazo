###############################################################################
# lambda - variables
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
# Functions
###############################################################################

variable "functions" {
  description = <<-EOT
    Map of functions to create, keyed by short name (e.g. "fixtures"). Each
    function gets its own IAM role, inline CloudWatch Logs policy, inline
    DynamoDB policy and log group.

    Packaging - provide exactly one of:
      source_dir  : directory zipped by Terraform at plan time
      package_path: path to a prebuilt .zip
      s3_bucket + s3_key (+ optional s3_object_version)

    Per-function fields fall back to the module-level defaults when omitted.
  EOT
  type = map(object({
    handler     = optional(string)
    runtime     = optional(string)
    description = optional(string)

    source_dir        = optional(string)
    package_path      = optional(string)
    s3_bucket         = optional(string)
    s3_key            = optional(string)
    s3_object_version = optional(string)

    memory_size  = optional(number)
    timeout      = optional(number)
    architecture = optional(string)

    environment_variables = optional(map(string), {})
    layers                = optional(list(string), [])

    reserved_concurrent_executions = optional(number)
    log_retention_days             = optional(number)
    tracing_mode                   = optional(string)

    # Extra managed/customer policy ARNs attached to this function's role.
    additional_policy_arns = optional(list(string), [])

    # Extra inline IAM statements for this function's role.
    additional_policy_statements = optional(list(object({
      sid       = optional(string)
      effect    = optional(string, "Allow")
      actions   = list(string)
      resources = list(string)
    })), [])

    tags = optional(map(string), {})
  }))
}

###############################################################################
# Defaults applied to every function
###############################################################################

variable "default_handler" {
  description = "Default Lambda handler."
  type        = string
  default     = "index.handler"
}

variable "default_runtime" {
  description = "Default Lambda runtime."
  type        = string
  default     = "nodejs22.x"
}

variable "default_memory_size" {
  description = "Default memory in MB (also scales CPU)."
  type        = number
  default     = 128
}

variable "default_timeout" {
  description = "Default timeout in seconds."
  type        = number
  default     = 10
}

variable "default_architecture" {
  description = "Default CPU architecture. arm64 (Graviton) is ~20% cheaper per GB-second than x86_64."
  type        = string
  default     = "arm64"

  validation {
    condition     = contains(["arm64", "x86_64"], var.default_architecture)
    error_message = "default_architecture must be arm64 or x86_64."
  }
}

variable "default_tracing_mode" {
  description = "X-Ray tracing mode: PassThrough or Active."
  type        = string
  default     = "PassThrough"
}

variable "common_environment_variables" {
  description = "Environment variables added to every function. Per-function values win on conflict."
  type        = map(string)
  default     = {}
}

###############################################################################
# Logging
###############################################################################

variable "log_retention_days" {
  description = "Default CloudWatch Logs retention in days."
  type        = number
  default     = 14
}

variable "log_kms_key_arn" {
  description = "Optional KMS key ARN for log group encryption."
  type        = string
  default     = null
}

###############################################################################
# DynamoDB access
###############################################################################

variable "dynamodb_table_arns" {
  description = "Cache table ARNs each function may read/write. Index ARNs (<table>/index/*) are added automatically. Leave empty to skip the DynamoDB policy."
  type        = list(string)
  default     = []
}

variable "dynamodb_actions" {
  description = "DynamoDB actions granted on dynamodb_table_arns."
  type        = list(string)
  default = [
    "dynamodb:GetItem",
    "dynamodb:BatchGetItem",
    "dynamodb:Query",
    "dynamodb:PutItem",
    "dynamodb:BatchWriteItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
  ]
}

variable "dynamodb_table_name" {
  description = "Optional cache table name injected into every function's environment."
  type        = string
  default     = null
}

variable "dynamodb_table_env_var_name" {
  description = "Environment variable name used to inject dynamodb_table_name."
  type        = string
  default     = "CACHE_TABLE_NAME"
}

###############################################################################
# Tags
###############################################################################

variable "tags" {
  description = "Additional tags merged over the module's default tags."
  type        = map(string)
  default     = {}
}
