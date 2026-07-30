###############################################################################
# api-gateway
#
# HTTP API (API Gateway v2) fronting the stats Lambdas. One AWS_PROXY
# integration per backing function, one route per method/path pair, and a
# stage-wide request throttle.
###############################################################################

locals {
  name_prefix = "${var.project}-${var.environment}"
  api_name    = coalesce(var.api_name, "${local.name_prefix}-api")

  use_custom_domain = var.domain_name != null

  tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )

  # "GET /fixtures" => { path, method, config }. merge(concat(...)) keeps this
  # valid when var.routes is empty.
  route_entries = merge(concat([{}], [
    for path, cfg in var.routes : {
      for method in cfg.methods : "${method} ${path}" => {
        path   = path
        method = method
        config = cfg
      }
    }
  ])...)

  # Routes that override the stage-level throttle.
  throttled_routes = {
    for key, entry in local.route_entries : key => entry
    if entry.config.throttling_rate_limit != null || entry.config.throttling_burst_limit != null
  }

  default_access_log_format = jsonencode({
    requestId        = "$context.requestId"
    ip               = "$context.identity.sourceIp"
    requestTime      = "$context.requestTime"
    httpMethod       = "$context.httpMethod"
    routeKey         = "$context.routeKey"
    path             = "$context.path"
    status           = "$context.status"
    protocol         = "$context.protocol"
    responseLength   = "$context.responseLength"
    responseLatency  = "$context.responseLatency"
    integrationError = "$context.integrationErrorMessage"
  })
}

###############################################################################
# API
###############################################################################

resource "aws_apigatewayv2_api" "this" {
  name          = local.api_name
  description   = coalesce(var.api_description, "${local.name_prefix} public stats API")
  protocol_type = "HTTP"

  dynamic "cors_configuration" {
    for_each = var.cors_enabled ? [1] : []

    content {
      allow_origins     = var.cors_allow_origins
      allow_methods     = var.cors_allow_methods
      allow_headers     = var.cors_allow_headers
      expose_headers    = var.cors_expose_headers
      allow_credentials = var.cors_allow_credentials
      max_age           = var.cors_max_age
    }
  }

  tags = merge(local.tags, { Name = local.api_name })

  lifecycle {
    precondition {
      condition     = !var.cors_allow_credentials || !contains(var.cors_allow_origins, "*")
      error_message = "cors_allow_credentials cannot be used with a wildcard origin."
    }
  }
}

###############################################################################
# Integrations + routes
###############################################################################

resource "aws_apigatewayv2_integration" "this" {
  for_each = var.routes

  api_id      = aws_apigatewayv2_api.this.id
  description = "Proxy integration for ${each.key}"

  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = each.value.lambda_invoke_arn
  payload_format_version = each.value.payload_format_version
  timeout_milliseconds   = each.value.timeout_milliseconds
}

resource "aws_apigatewayv2_route" "this" {
  for_each = local.route_entries

  api_id    = aws_apigatewayv2_api.this.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.this[each.value.path].id}"

  authorization_type = each.value.config.authorization_type
  authorizer_id      = each.value.config.authorizer_id
}

# Allow the API to invoke each backing function, scoped to that route's path.
resource "aws_lambda_permission" "this" {
  for_each = var.routes

  statement_id  = "AllowInvokeFrom-${local.api_name}-${replace(trim(each.key, "/"), "/[^a-zA-Z0-9]+/", "-")}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*${each.key}"
}

###############################################################################
# Stage
###############################################################################

resource "aws_cloudwatch_log_group" "access_logs" {
  count = var.access_logs_enabled ? 1 : 0

  name              = "/aws/apigateway/${local.api_name}"
  retention_in_days = var.access_logs_retention_days

  tags = local.tags
}

resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = var.stage_name
  auto_deploy = var.auto_deploy

  default_route_settings {
    throttling_rate_limit    = var.throttling_rate_limit
    throttling_burst_limit   = var.throttling_burst_limit
    detailed_metrics_enabled = var.detailed_metrics_enabled
  }

  dynamic "route_settings" {
    for_each = local.throttled_routes

    content {
      route_key                = route_settings.key
      throttling_rate_limit    = coalesce(route_settings.value.config.throttling_rate_limit, var.throttling_rate_limit)
      throttling_burst_limit   = coalesce(route_settings.value.config.throttling_burst_limit, var.throttling_burst_limit)
      detailed_metrics_enabled = var.detailed_metrics_enabled
    }
  }

  dynamic "access_log_settings" {
    for_each = var.access_logs_enabled ? [1] : []

    content {
      destination_arn = aws_cloudwatch_log_group.access_logs[0].arn
      format          = coalesce(var.access_log_format, local.default_access_log_format)
    }
  }

  tags = local.tags
}

###############################################################################
# Custom domain (optional)
###############################################################################

resource "aws_apigatewayv2_domain_name" "this" {
  count = local.use_custom_domain ? 1 : 0

  domain_name = var.domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = var.domain_security_policy
  }

  tags = merge(local.tags, { Name = var.domain_name })

  lifecycle {
    precondition {
      condition     = var.acm_certificate_arn != null
      error_message = "acm_certificate_arn is required when domain_name is set (certificate must be in the API's region)."
    }
  }
}

resource "aws_apigatewayv2_api_mapping" "this" {
  count = local.use_custom_domain ? 1 : 0

  api_id      = aws_apigatewayv2_api.this.id
  domain_name = aws_apigatewayv2_domain_name.this[0].id
  stage       = aws_apigatewayv2_stage.this.id

  api_mapping_key = var.api_mapping_key
}
