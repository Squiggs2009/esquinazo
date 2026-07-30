###############################################################################
# lambda
#
# Creates one Lambda function per entry in var.functions, each with a dedicated
# IAM role (least privilege: its own log group + the cache table only), an
# explicitly managed log group, and arm64 / 128 MB defaults.
###############################################################################

locals {
  name_prefix = "${var.project}-${var.environment}"

  tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )

  injected_env = var.dynamodb_table_name == null ? {} : {
    (var.dynamodb_table_env_var_name) = var.dynamodb_table_name
  }

  # Resolved per-function settings: explicit value, else module default.
  functions = {
    for name, cfg in var.functions : name => {
      function_name = "${local.name_prefix}-${name}"
      description   = coalesce(cfg.description, "${local.name_prefix} ${name} handler")

      handler      = coalesce(cfg.handler, var.default_handler)
      runtime      = coalesce(cfg.runtime, var.default_runtime)
      memory_size  = coalesce(cfg.memory_size, var.default_memory_size)
      timeout      = coalesce(cfg.timeout, var.default_timeout)
      architecture = coalesce(cfg.architecture, var.default_architecture)
      tracing_mode = coalesce(cfg.tracing_mode, var.default_tracing_mode)

      log_retention_days = coalesce(cfg.log_retention_days, var.log_retention_days)

      layers                         = cfg.layers
      reserved_concurrent_executions = cfg.reserved_concurrent_executions

      # Per-function values override the shared ones.
      environment_variables = merge(
        var.common_environment_variables,
        local.injected_env,
        cfg.environment_variables,
      )

      source_dir        = cfg.source_dir
      package_path      = cfg.package_path
      s3_bucket         = cfg.s3_bucket
      s3_key            = cfg.s3_key
      s3_object_version = cfg.s3_object_version

      package_count = length([
        for candidate in [cfg.source_dir, cfg.package_path, cfg.s3_bucket] : candidate
        if candidate != null
      ])

      tags = merge(local.tags, cfg.tags, { Name = "${local.name_prefix}-${name}" })
    }
  }

  # DynamoDB tables plus their indexes.
  dynamodb_resources = flatten([
    for arn in var.dynamodb_table_arns : [arn, "${arn}/index/*"]
  ])

  attach_dynamodb_policy = length(var.dynamodb_table_arns) > 0

  # function key x managed policy ARN, flattened for a single for_each.
  managed_policy_attachments = merge([
    for name, cfg in var.functions : {
      for arn in cfg.additional_policy_arns : "${name}:${arn}" => {
        function = name
        arn      = arn
      }
    }
  ]...)

  functions_with_extra_statements = {
    for name, cfg in var.functions : name => cfg
    if length(cfg.additional_policy_statements) > 0
  }
}

###############################################################################
# Packaging
###############################################################################

data "archive_file" "this" {
  for_each = { for name, cfg in local.functions : name => cfg if cfg.source_dir != null }

  type        = "zip"
  source_dir  = each.value.source_dir
  output_path = "${path.module}/.build/${each.key}.zip"
}

###############################################################################
# Logging
###############################################################################

resource "aws_cloudwatch_log_group" "this" {
  for_each = local.functions

  name              = "/aws/lambda/${each.value.function_name}"
  retention_in_days = each.value.log_retention_days
  kms_key_id        = var.log_kms_key_arn

  tags = each.value.tags
}

###############################################################################
# IAM - one role per function
###############################################################################

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "this" {
  for_each = local.functions

  name               = "${each.value.function_name}-role"
  description        = "Execution role for ${each.value.function_name}"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json

  tags = each.value.tags
}

# CloudWatch Logs, scoped to this function's own log group.
data "aws_iam_policy_document" "logs" {
  for_each = local.functions

  statement {
    sid    = "WriteOwnLogGroup"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [
      aws_cloudwatch_log_group.this[each.key].arn,
      "${aws_cloudwatch_log_group.this[each.key].arn}:*",
    ]
  }
}

resource "aws_iam_role_policy" "logs" {
  for_each = local.functions

  name   = "cloudwatch-logs"
  role   = aws_iam_role.this[each.key].id
  policy = data.aws_iam_policy_document.logs[each.key].json
}

# DynamoDB cache access.
data "aws_iam_policy_document" "dynamodb" {
  count = local.attach_dynamodb_policy ? 1 : 0

  statement {
    sid       = "CacheTableAccess"
    effect    = "Allow"
    actions   = var.dynamodb_actions
    resources = local.dynamodb_resources
  }
}

resource "aws_iam_role_policy" "dynamodb" {
  for_each = local.attach_dynamodb_policy ? local.functions : {}

  name   = "dynamodb-cache"
  role   = aws_iam_role.this[each.key].id
  policy = data.aws_iam_policy_document.dynamodb[0].json
}

# Optional extra inline statements per function.
data "aws_iam_policy_document" "additional" {
  for_each = local.functions_with_extra_statements

  dynamic "statement" {
    for_each = each.value.additional_policy_statements

    content {
      sid       = statement.value.sid
      effect    = statement.value.effect
      actions   = statement.value.actions
      resources = statement.value.resources
    }
  }
}

resource "aws_iam_role_policy" "additional" {
  for_each = local.functions_with_extra_statements

  name   = "additional"
  role   = aws_iam_role.this[each.key].id
  policy = data.aws_iam_policy_document.additional[each.key].json
}

resource "aws_iam_role_policy_attachment" "additional" {
  for_each = local.managed_policy_attachments

  role       = aws_iam_role.this[each.value.function].name
  policy_arn = each.value.arn
}

###############################################################################
# Functions
###############################################################################

resource "aws_lambda_function" "this" {
  for_each = local.functions

  function_name = each.value.function_name
  description   = each.value.description
  role          = aws_iam_role.this[each.key].arn

  handler       = each.value.handler
  runtime       = each.value.runtime
  architectures = [each.value.architecture]
  memory_size   = each.value.memory_size
  timeout       = each.value.timeout
  layers        = each.value.layers

  reserved_concurrent_executions = coalesce(each.value.reserved_concurrent_executions, -1)

  # Local zip (built by archive_file or prebuilt) or an S3 artifact.
  filename = each.value.source_dir != null ? data.archive_file.this[each.key].output_path : each.value.package_path

  source_code_hash = each.value.source_dir != null ? data.archive_file.this[each.key].output_base64sha256 : (
    each.value.package_path != null ? filebase64sha256(each.value.package_path) : null
  )

  s3_bucket         = each.value.s3_bucket
  s3_key            = each.value.s3_key
  s3_object_version = each.value.s3_object_version

  dynamic "environment" {
    for_each = length(each.value.environment_variables) > 0 ? [1] : []

    content {
      variables = each.value.environment_variables
    }
  }

  tracing_config {
    mode = each.value.tracing_mode
  }

  tags = each.value.tags

  # Keep the Terraform-managed log group (with its retention) authoritative.
  depends_on = [
    aws_cloudwatch_log_group.this,
    aws_iam_role_policy.logs,
  ]

  lifecycle {
    precondition {
      condition     = each.value.package_count == 1
      error_message = "Function '${each.key}': set exactly one of source_dir, package_path, or s3_bucket/s3_key."
    }
  }
}
