###############################################################################
# dev environment
#
# Composes the whole Esquinazo stack:
#
#   s3-cloudfront -> React bundle on a private bucket behind CloudFront
#   dynamodb      -> TTL cache for upstream football data
#   lambda        -> fixtures / standings / players / transfers / teams / news / refresh
#   api-gateway   -> HTTP API routing /fixtures, /standings, /players, /transfers, /teams, /news
#   eventbridge   -> 5-minute schedule invoking the refresh function
#   route53       -> DNS, skipped entirely while domain_name is "localhost"
#
# Backend configuration lives in backend.tf.
###############################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix = "esquinazo-${var.environment}"

  # "localhost" means no custom domain anywhere in the stack.
  use_custom_domain = var.domain_name != "localhost"

  site_domains = local.use_custom_domain ? [var.domain_name, "www.${var.domain_name}"] : []
  api_domain   = local.use_custom_domain ? "api.${var.domain_name}" : null

  # Functions fronted by the HTTP API. "refresh" is deliberately excluded: it
  # is only ever invoked by EventBridge.
  api_function_names = ["fixtures", "standings", "players", "transfers", "teams"]

  # Relative source dirs are resolved from this directory, not the caller's cwd.
  lambda_source_root = "${path.module}/${var.lambda_source_dir}"

  api_functions = {
    for name in local.api_function_names : name => {
      source_dir = "${local.lambda_source_root}/${name}"
    }
  }

  # Fanning out to several upstream endpoints takes longer than a cache read.
  refresh_function = {
    refresh = {
      source_dir = "${local.lambda_source_root}/refresh"
      timeout    = 60
    }
  }

  # Kept out of api_functions/api_function_names: unlike those, this function
  # needs its own environment_variables. NEWS_API_KEY is scoped to just this
  # function rather than added to common_environment_variables, so it is not
  # readable from every other Lambda's console/env.
  news_function = {
    news = {
      source_dir = "${local.lambda_source_root}/news"
      environment_variables = {
        NEWS_API_KEY = var.news_api_key
      }
    }
  }

  cors_allow_origins = local.use_custom_domain ? [
    "https://${var.domain_name}",
    "https://www.${var.domain_name}",
  ] : ["*"]

  tags = var.tags
}

###############################################################################
# Static site
###############################################################################

module "web" {
  source = "../../modules/s3-cloudfront"

  environment = var.environment
  bucket_name = var.web_bucket_name

  domain_names        = local.site_domains
  acm_certificate_arn = local.use_custom_domain ? var.cloudfront_certificate_arn : null

  price_class  = "PriceClass_100"
  spa_fallback = true

  tags = local.tags
}

###############################################################################
# Cache table
###############################################################################

module "cache" {
  source = "../../modules/dynamodb"

  environment = var.environment

  hash_key           = "PK"
  range_key          = "SK"
  ttl_attribute_name = "expires_at"
  billing_mode       = "PAY_PER_REQUEST"

  tags = local.tags
}

###############################################################################
# Lambda functions
#
# Each function gets its own IAM role; all of them get read/write access to the
# cache table and the upstream API key.
###############################################################################

module "functions" {
  source = "../../modules/lambda"

  environment = var.environment

  functions = merge(local.api_functions, local.news_function, local.refresh_function)

  default_memory_size  = 128
  default_architecture = "arm64"
  log_retention_days   = var.log_retention_days

  dynamodb_table_arns = [module.cache.table_arn]
  dynamodb_table_name = module.cache.table_name

  common_environment_variables = {
    FOOTBALL_DATA_API_KEY = var.football_data_api_key
    CACHE_TTL_SECONDS     = tostring(var.cache_ttl_seconds)
    ENVIRONMENT           = var.environment
    NODE_OPTIONS          = "--enable-source-maps"
  }

  tags = local.tags
}

###############################################################################
# HTTP API
###############################################################################

module "api" {
  source = "../../modules/api-gateway"

  environment = var.environment

  routes = merge(
    {
      for name in local.api_function_names : "/${name}" => {
        lambda_function_name = module.functions.function_names[name]
        lambda_invoke_arn    = module.functions.invoke_arns[name]
        methods              = ["GET"]
      }
    },
    {
      "/news" = {
        lambda_function_name = module.functions.function_names["news"]
        lambda_invoke_arn    = module.functions.invoke_arns["news"]
        methods              = ["GET"]
      }
    },
  )

  throttling_rate_limit  = var.api_throttling_rate_limit
  throttling_burst_limit = var.api_throttling_burst_limit

  cors_enabled       = true
  cors_allow_origins = local.cors_allow_origins
  cors_allow_methods = ["GET", "OPTIONS"]

  domain_name         = local.api_domain
  acm_certificate_arn = local.use_custom_domain ? var.api_certificate_arn : null

  access_logs_enabled        = true
  access_logs_retention_days = var.log_retention_days

  tags = local.tags
}

###############################################################################
# Scheduled cache refresh
###############################################################################

module "refresh_schedule" {
  source = "../../modules/eventbridge"

  environment = var.environment

  rule_name           = "${local.name_prefix}-refresh"
  schedule_expression = var.refresh_schedule_expression
  lambda_arn          = module.functions.function_arns["refresh"]
  description         = "Refreshes the ${var.environment} football data cache"

  tags = local.tags
}

###############################################################################
# DNS
#
# Creates nothing while domain_name is "localhost".
###############################################################################

module "dns" {
  source = "../../modules/route53"

  environment    = var.environment
  domain_name    = var.domain_name
  hosted_zone_id = var.hosted_zone_id

  cloudfront_domain  = module.web.distribution_domain_name
  cloudfront_zone_id = module.web.distribution_hosted_zone_id
  api_gateway_domain = module.api.custom_domain_target

  tags = local.tags
}

###############################################################################
# Outputs
###############################################################################

output "website_url" {
  description = "Public URL of the site."
  value       = module.web.site_url
}

output "api_endpoint" {
  description = "Base URL of the HTTP API."
  value       = module.api.base_url
}

output "cloudfront_id" {
  description = "CloudFront distribution ID (use for cache invalidation after a deploy)."
  value       = module.web.distribution_id
}

output "dynamodb_table_name" {
  description = "Name of the cache table."
  value       = module.cache.table_name
}

output "web_bucket_name" {
  description = "Bucket the React bundle is synced to."
  value       = module.web.bucket_id
}

output "lambda_function_names" {
  description = "Deployed Lambda function names, keyed by short name."
  value       = module.functions.function_names
}

output "route53_zone_id" {
  description = "Hosted zone ID, or null when domain_name is \"localhost\"."
  value       = module.dns.zone_id
}
