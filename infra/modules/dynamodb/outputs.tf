###############################################################################
# dynamodb - outputs
###############################################################################

output "table_name" {
  description = "Name of the cache table."
  value       = aws_dynamodb_table.this.name
}

output "table_id" {
  description = "ID of the cache table."
  value       = aws_dynamodb_table.this.id
}

output "table_arn" {
  description = "ARN of the cache table (pass to the lambda module for IAM access)."
  value       = aws_dynamodb_table.this.arn
}

output "table_stream_arn" {
  description = "Stream ARN, or null when streams are disabled."
  value       = var.stream_enabled ? aws_dynamodb_table.this.stream_arn : null
}

output "hash_key" {
  description = "Partition key attribute name."
  value       = aws_dynamodb_table.this.hash_key
}

output "range_key" {
  description = "Sort key attribute name."
  value       = aws_dynamodb_table.this.range_key
}

output "ttl_attribute_name" {
  description = "TTL attribute name, or null when TTL is disabled."
  value       = var.ttl_enabled ? var.ttl_attribute_name : null
}

output "global_secondary_index_names" {
  description = "Names of the configured global secondary indexes."
  value       = [for gsi in var.global_secondary_indexes : gsi.name]
}
