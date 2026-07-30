###############################################################################
# dynamodb
#
# Single-table cache for upstream football-data API responses. Items are keyed
# by PK/SK and expire automatically through the TTL attribute (expires_at),
# so stale entries cost nothing to clean up.
###############################################################################

locals {
  table_name = coalesce(var.table_name, "${var.project}-${var.environment}-cache")

  is_provisioned = var.billing_mode == "PROVISIONED"

  # DynamoDB only requires attribute definitions for key attributes. Collect
  # them from the table keys plus every GSI, deduplicated by name.
  key_attributes = concat(
    [{ name = var.hash_key, type = var.key_type }],
    var.range_key == null ? [] : [{ name = var.range_key, type = var.key_type }],
    flatten([
      for gsi in var.global_secondary_indexes : concat(
        [{ name = gsi.hash_key, type = coalesce(gsi.hash_key_type, var.key_type) }],
        gsi.range_key == null ? [] : [{ name = gsi.range_key, type = coalesce(gsi.range_key_type, var.key_type) }],
      )
    ]),
  )

  attributes = { for attr in local.key_attributes : attr.name => attr.type }

  tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

resource "aws_dynamodb_table" "this" {
  name         = local.table_name
  billing_mode = var.billing_mode
  table_class  = var.table_class

  hash_key  = var.hash_key
  range_key = var.range_key

  read_capacity  = local.is_provisioned ? var.read_capacity : null
  write_capacity = local.is_provisioned ? var.write_capacity : null

  deletion_protection_enabled = var.deletion_protection_enabled

  stream_enabled   = var.stream_enabled
  stream_view_type = var.stream_enabled ? var.stream_view_type : null

  dynamic "attribute" {
    for_each = local.attributes

    content {
      name = attribute.key
      type = attribute.value
    }
  }

  ttl {
    enabled        = var.ttl_enabled
    attribute_name = var.ttl_enabled ? var.ttl_attribute_name : null
  }

  dynamic "global_secondary_index" {
    for_each = { for gsi in var.global_secondary_indexes : gsi.name => gsi }

    content {
      name               = global_secondary_index.value.name
      hash_key           = global_secondary_index.value.hash_key
      range_key          = global_secondary_index.value.range_key
      projection_type    = global_secondary_index.value.projection_type
      non_key_attributes = global_secondary_index.value.non_key_attributes
      read_capacity      = local.is_provisioned ? global_secondary_index.value.read_capacity : null
      write_capacity     = local.is_provisioned ? global_secondary_index.value.write_capacity : null
    }
  }

  point_in_time_recovery {
    enabled = var.point_in_time_recovery_enabled
  }

  server_side_encryption {
    enabled     = var.server_side_encryption_kms_key_arn != null
    kms_key_arn = var.server_side_encryption_kms_key_arn
  }

  tags = merge(local.tags, { Name = local.table_name })

  lifecycle {
    precondition {
      condition     = var.billing_mode != "PROVISIONED" || (var.read_capacity != null && var.write_capacity != null)
      error_message = "read_capacity and write_capacity are required when billing_mode is PROVISIONED."
    }
  }
}
