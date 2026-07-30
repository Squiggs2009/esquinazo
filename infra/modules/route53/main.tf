###############################################################################
# route53
#
# DNS for the public site and API. Every resource is conditional: when
# domain_name is the sentinel "localhost" the module creates nothing, which is
# what lets the dev stack run on the generated CloudFront / execute-api
# endpoints without owning a hosted zone.
#
#   <domain>      A / AAAA alias -> CloudFront
#   www.<domain>  CNAME          -> <domain>
#   api.<domain>  CNAME          -> API Gateway regional domain
###############################################################################

locals {
  enabled = var.domain_name != "localhost" && var.domain_name != null && var.domain_name != ""

  # These drive `count`, so they must depend only on values known at plan time.
  # Deriving them from cloudfront_domain / api_gateway_domain instead would fail
  # with "Invalid count argument" whenever those come from resources in the same
  # apply, which is the normal case. Whether the targets are actually populated
  # is asserted per-resource below, where it can be checked at apply time.
  create_apex_records = local.enabled && var.create_apex_records
  create_www_record   = local.enabled && var.create_apex_records && var.create_www_record
  create_api_record   = local.enabled && var.create_api_record

  # Look the zone up only when the caller did not hand us an ID.
  lookup_zone = local.enabled && var.hosted_zone_id == null

  zone_id = var.hosted_zone_id != null ? var.hosted_zone_id : (
    local.lookup_zone ? data.aws_route53_zone.this[0].zone_id : null
  )
}

data "aws_route53_zone" "this" {
  count = local.lookup_zone ? 1 : 0

  name         = var.domain_name
  private_zone = var.private_zone
}

###############################################################################
# Apex -> CloudFront
###############################################################################

resource "aws_route53_record" "apex_a" {
  count = local.create_apex_records ? 1 : 0

  zone_id = local.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.cloudfront_domain
    zone_id                = var.cloudfront_zone_id
    evaluate_target_health = false
  }

  lifecycle {
    precondition {
      condition     = var.cloudfront_domain != null && var.cloudfront_zone_id != null
      error_message = "cloudfront_domain and cloudfront_zone_id are required when create_apex_records is true."
    }
  }
}

resource "aws_route53_record" "apex_aaaa" {
  count = local.create_apex_records ? 1 : 0

  zone_id = local.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = var.cloudfront_domain
    zone_id                = var.cloudfront_zone_id
    evaluate_target_health = false
  }

  lifecycle {
    precondition {
      condition     = var.cloudfront_domain != null && var.cloudfront_zone_id != null
      error_message = "cloudfront_domain and cloudfront_zone_id are required when create_apex_records is true."
    }
  }
}

###############################################################################
# www -> apex
#
# The distribution must list www.<domain> as an alias (and cover it with its
# certificate) for this to serve traffic rather than fail TLS.
###############################################################################

resource "aws_route53_record" "www" {
  count = local.create_www_record ? 1 : 0

  zone_id = local.zone_id
  name    = "${var.www_subdomain}.${var.domain_name}"
  type    = "CNAME"
  ttl     = var.record_ttl
  records = [var.domain_name]
}

###############################################################################
# api -> API Gateway
###############################################################################

resource "aws_route53_record" "api" {
  count = local.create_api_record ? 1 : 0

  zone_id = local.zone_id
  name    = "${var.api_subdomain}.${var.domain_name}"
  type    = "CNAME"
  ttl     = var.record_ttl
  records = [var.api_gateway_domain]

  lifecycle {
    precondition {
      condition     = var.api_gateway_domain != null
      error_message = "api_gateway_domain is required when create_api_record is true. Pass the api-gateway module's custom_domain_target output."
    }
  }
}
