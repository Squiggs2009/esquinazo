###############################################################################
# bootstrap - variables
###############################################################################

variable "aws_region" {
  description = "AWS region hosting the Terraform state bucket and lock table."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name, used for resource naming and the Project tag."
  type        = string
  default     = "esquinazo"
}

variable "tags" {
  description = "Additional tags merged over the module's default tags."
  type        = map(string)
  default     = {}
}
