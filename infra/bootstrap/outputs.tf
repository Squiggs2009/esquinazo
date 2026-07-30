###############################################################################
# bootstrap - outputs
#
# Feed these into the backend block of every other stack, e.g.
#
#   terraform {
#     backend "s3" {
#       bucket         = "<bucket_name>"
#       key            = "dev/terraform.tfstate"
#       region         = "us-east-1"
#       dynamodb_table = "<dynamodb_table_name>"
#       encrypt        = true
#     }
#   }
#
# Backend blocks cannot interpolate variables, so these values must be pasted
# in literally (or supplied via -backend-config).
###############################################################################

output "bucket_name" {
  description = "Name of the S3 bucket holding Terraform state."
  value       = aws_s3_bucket.terraform_state.id
}

output "bucket_arn" {
  description = "ARN of the Terraform state bucket."
  value       = aws_s3_bucket.terraform_state.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table used for state locking."
  value       = aws_dynamodb_table.terraform_locks.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB state lock table."
  value       = aws_dynamodb_table.terraform_locks.arn
}

output "aws_region" {
  description = "Region the backend resources live in."
  value       = var.aws_region
}
