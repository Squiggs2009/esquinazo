###############################################################################
# eventbridge
#
# Scheduled trigger for a single Lambda function - used to keep the cache warm
# by refreshing upstream football data on a fixed interval.
###############################################################################

locals {
  tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

resource "aws_cloudwatch_event_rule" "this" {
  name                = var.rule_name
  description         = coalesce(var.description, "Scheduled invocation of ${var.rule_name}")
  schedule_expression = var.schedule_expression
  state               = var.enabled ? "ENABLED" : "DISABLED"

  tags = merge(local.tags, { Name = var.rule_name })
}

resource "aws_cloudwatch_event_target" "this" {
  rule      = aws_cloudwatch_event_rule.this.name
  target_id = var.rule_name
  arn       = var.lambda_arn
  input     = var.input

  retry_policy {
    maximum_retry_attempts       = var.maximum_retry_attempts
    maximum_event_age_in_seconds = var.maximum_event_age_in_seconds
  }

  dynamic "dead_letter_config" {
    for_each = var.dead_letter_queue_arn == null ? [] : [var.dead_letter_queue_arn]

    content {
      arn = dead_letter_config.value
    }
  }
}

# Resource-based policy allowing this specific rule to invoke the function.
resource "aws_lambda_permission" "this" {
  statement_id  = "AllowExecutionFrom-${var.rule_name}"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.this.arn
}
