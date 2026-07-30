###############################################################################
# s3-cloudfront - outputs
###############################################################################

output "bucket_id" {
  description = "Name of the origin bucket."
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "ARN of the origin bucket."
  value       = aws_s3_bucket.this.arn
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the origin bucket."
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}

output "distribution_id" {
  description = "CloudFront distribution ID (use for cache invalidations in CI)."
  value       = aws_cloudfront_distribution.this.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.this.arn
}

output "distribution_domain_name" {
  description = "CloudFront-assigned domain name (*.cloudfront.net)."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "distribution_hosted_zone_id" {
  description = "CloudFront hosted zone ID, for Route 53 alias records."
  value       = aws_cloudfront_distribution.this.hosted_zone_id
}

output "origin_access_control_id" {
  description = "ID of the Origin Access Control used by the distribution."
  value       = aws_cloudfront_origin_access_control.this.id
}

output "site_url" {
  description = "Primary URL of the site."
  value       = "https://${length(var.domain_names) > 0 ? var.domain_names[0] : aws_cloudfront_distribution.this.domain_name}"
}
