###############################################################################
# route53 - outputs
#
# All outputs are null when the module is disabled (domain_name = "localhost").
###############################################################################

output "zone_id" {
  description = "Hosted zone ID in use, whether supplied or looked up. Null when the module is disabled."
  value       = local.zone_id
}

output "zone_name" {
  description = "Hosted zone name. Null unless the zone was looked up by data source."
  value       = local.lookup_zone ? data.aws_route53_zone.this[0].name : null
}

output "name_servers" {
  description = "Name servers for the zone. Null unless the zone was looked up by data source."
  value       = local.lookup_zone ? data.aws_route53_zone.this[0].name_servers : null
}

output "enabled" {
  description = "Whether DNS records were managed for this stack."
  value       = local.enabled
}

output "site_fqdn" {
  description = "Apex record FQDN, or null when no apex records were created."
  value       = local.create_apex_records ? var.domain_name : null
}

output "api_fqdn" {
  description = "API record FQDN, or null when no api record was created."
  value       = local.create_api_record ? "${var.api_subdomain}.${var.domain_name}" : null
}
