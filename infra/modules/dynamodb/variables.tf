###############################################################################
# dynamodb - variables
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

variable "table_name" {
  description = "Table name. Defaults to \"<project>-<environment>-cache\"."
  type        = string
  default     = null
}

###############################################################################
# Keys
###############################################################################

variable "hash_key" {
  description = "Partition key attribute name."
  type        = string
  default     = "PK"
}

variable "range_key" {
  description = "Sort key attribute name. Set to null for a key-only table."
  type        = string
  default     = "SK"
}

variable "key_type" {
  description = "Attribute type for the partition and sort keys (S, N or B)."
  type        = string
  default     = "S"

  validation {
    condition     = contains(["S", "N", "B"], var.key_type)
    error_message = "key_type must be one of S, N, B."
  }
}

###############################################################################
# TTL
###############################################################################

variable "ttl_enabled" {
  description = "Enable DynamoDB TTL so expired cache entries are removed automatically."
  type        = bool
  default     = true
}

variable "ttl_attribute_name" {
  description = "Attribute holding the epoch-seconds expiry timestamp."
  type        = string
  default     = "expires_at"
}

###############################################################################
# Capacity
###############################################################################

variable "billing_mode" {
  description = "PAY_PER_REQUEST (on-demand) or PROVISIONED."
  type        = string
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.billing_mode)
    error_message = "billing_mode must be PAY_PER_REQUEST or PROVISIONED."
  }
}

variable "read_capacity" {
  description = "Provisioned read capacity units. Only used when billing_mode is PROVISIONED."
  type        = number
  default     = null
}

variable "write_capacity" {
  description = "Provisioned write capacity units. Only used when billing_mode is PROVISIONED."
  type        = number
  default     = null
}

###############################################################################
# Secondary indexes
###############################################################################

variable "global_secondary_indexes" {
  description = <<-EOT
    Optional GSIs. Each entry: name, hash_key, optional range_key, projection_type
    (ALL | KEYS_ONLY | INCLUDE), optional non_key_attributes, and read/write
    capacity when billing_mode is PROVISIONED. Key attribute types default to
    var.key_type and can be overridden per index.
  EOT
  type = list(object({
    name               = string
    hash_key           = string
    hash_key_type      = optional(string)
    range_key          = optional(string)
    range_key_type     = optional(string)
    projection_type    = optional(string, "ALL")
    non_key_attributes = optional(list(string))
    read_capacity      = optional(number)
    write_capacity     = optional(number)
  }))
  default = []
}

###############################################################################
# Durability / protection
###############################################################################

variable "point_in_time_recovery_enabled" {
  description = "Enable point-in-time recovery. Usually unnecessary for a rebuildable cache table."
  type        = bool
  default     = false
}

variable "deletion_protection_enabled" {
  description = "Block table deletion via the AWS API."
  type        = bool
  default     = false
}

variable "server_side_encryption_kms_key_arn" {
  description = "Customer-managed KMS key ARN. When null, DynamoDB uses the AWS-owned key."
  type        = string
  default     = null
}

variable "stream_enabled" {
  description = "Enable DynamoDB Streams on the table."
  type        = bool
  default     = false
}

variable "stream_view_type" {
  description = "Stream view type: KEYS_ONLY, NEW_IMAGE, OLD_IMAGE or NEW_AND_OLD_IMAGES."
  type        = string
  default     = "NEW_AND_OLD_IMAGES"
}

variable "table_class" {
  description = "STANDARD or STANDARD_INFREQUENT_ACCESS."
  type        = string
  default     = "STANDARD"
}

###############################################################################
# Tags
###############################################################################

variable "tags" {
  description = "Additional tags merged over the module's default tags."
  type        = map(string)
  default     = {}
}
