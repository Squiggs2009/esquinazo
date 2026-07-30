###############################################################################
# api-gateway - outputs
###############################################################################

output "api_id" {
  description = "HTTP API ID."
  value       = aws_apigatewayv2_api.this.id
}

output "api_arn" {
  description = "HTTP API ARN."
  value       = aws_apigatewayv2_api.this.arn
}

output "api_endpoint" {
  description = "Default execute-api endpoint for the API."
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "execution_arn" {
  description = "Execution ARN used in Lambda invoke permissions."
  value       = aws_apigatewayv2_api.this.execution_arn
}

output "stage_name" {
  description = "Deployed stage name."
  value       = aws_apigatewayv2_stage.this.name
}

output "stage_invoke_url" {
  description = "Invoke URL for the deployed stage."
  value       = aws_apigatewayv2_stage.this.invoke_url
}

output "route_keys" {
  description = "All configured route keys (e.g. \"GET /fixtures\")."
  value       = sort(keys(local.route_entries))
}

output "integration_ids" {
  description = "Map of route path => integration ID."
  value       = { for k, integration in aws_apigatewayv2_integration.this : k => integration.id }
}

output "access_log_group_name" {
  description = "Access log group name, or null when access logging is disabled."
  value       = var.access_logs_enabled ? aws_cloudwatch_log_group.access_logs[0].name : null
}

output "custom_domain_name" {
  description = "Configured custom domain, or null."
  value       = local.use_custom_domain ? aws_apigatewayv2_domain_name.this[0].domain_name : null
}

output "custom_domain_target" {
  description = "Regional target domain for a Route 53 alias record, or null."
  value       = local.use_custom_domain ? aws_apigatewayv2_domain_name.this[0].domain_name_configuration[0].target_domain_name : null
}

output "custom_domain_hosted_zone_id" {
  description = "Regional hosted zone ID for a Route 53 alias record, or null."
  value       = local.use_custom_domain ? aws_apigatewayv2_domain_name.this[0].domain_name_configuration[0].hosted_zone_id : null
}

output "base_url" {
  description = "Public base URL of the API."
  value       = local.use_custom_domain ? "https://${var.domain_name}${var.api_mapping_key == null ? "" : "/${var.api_mapping_key}"}" : aws_apigatewayv2_stage.this.invoke_url
}
