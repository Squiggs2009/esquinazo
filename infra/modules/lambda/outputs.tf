###############################################################################
# lambda - outputs
#
# All outputs are keyed by the short function name used in var.functions,
# so the api-gateway module can look them up directly.
###############################################################################

output "function_names" {
  description = "Map of short name => full Lambda function name."
  value       = { for k, fn in aws_lambda_function.this : k => fn.function_name }
}

output "function_arns" {
  description = "Map of short name => Lambda function ARN."
  value       = { for k, fn in aws_lambda_function.this : k => fn.arn }
}

output "invoke_arns" {
  description = "Map of short name => invoke ARN (for API Gateway AWS_PROXY integrations)."
  value       = { for k, fn in aws_lambda_function.this : k => fn.invoke_arn }
}

output "qualified_arns" {
  description = "Map of short name => version-qualified function ARN."
  value       = { for k, fn in aws_lambda_function.this : k => fn.qualified_arn }
}

output "role_names" {
  description = "Map of short name => execution role name."
  value       = { for k, role in aws_iam_role.this : k => role.name }
}

output "role_arns" {
  description = "Map of short name => execution role ARN."
  value       = { for k, role in aws_iam_role.this : k => role.arn }
}

output "log_group_names" {
  description = "Map of short name => CloudWatch log group name."
  value       = { for k, lg in aws_cloudwatch_log_group.this : k => lg.name }
}

output "log_group_arns" {
  description = "Map of short name => CloudWatch log group ARN."
  value       = { for k, lg in aws_cloudwatch_log_group.this : k => lg.arn }
}
