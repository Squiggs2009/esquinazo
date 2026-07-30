###############################################################################
# eventbridge - variables
###############################################################################

variable "rule_name" {
  description = "Name of the EventBridge schedule rule."
  type        = string
}

variable "schedule_expression" {
  description = "Schedule for the rule: rate(...) or cron(...)."
  type        = string
  default     = "rate(5 minutes)"
}

variable "lambda_arn" {
  description = "ARN of the Lambda function invoked on schedule."
  type        = string
}

###############################################################################
# Tagging context
#
# project/environment are needed here so the rule carries the same
# Project/Environment tags as every other resource in the stack.
###############################################################################

variable "project" {
  description = "Project name, used for tagging."
  type        = string
  default     = "esquinazo"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
}

variable "tags" {
  description = "Additional tags merged over the module's default tags."
  type        = map(string)
  default     = {}
}

###############################################################################
# Optional behaviour
###############################################################################

variable "enabled" {
  description = "Whether the schedule is active."
  type        = bool
  default     = true
}

variable "description" {
  description = "Rule description."
  type        = string
  default     = null
}

variable "input" {
  description = "Optional constant JSON payload passed to the target instead of the raw event."
  type        = string
  default     = null
}

variable "maximum_retry_attempts" {
  description = "Retry attempts before the invocation is discarded or sent to the DLQ."
  type        = number
  default     = 2
}

variable "maximum_event_age_in_seconds" {
  description = "Maximum age of an event that EventBridge will still attempt to deliver."
  type        = number
  default     = 3600
}

variable "dead_letter_queue_arn" {
  description = "Optional SQS queue ARN receiving invocations that exhaust their retries."
  type        = string
  default     = null
}
