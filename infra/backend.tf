###############################################################################
# Root backend - partial configuration
#
# Empty backend block: every value is supplied at init time rather than being
# hardcoded here, which is what lets one configuration target several state
# keys.
#
#   terraform init \
#     -backend-config="bucket=esquinazo-terraform-state-bgaculhn" \
#     -backend-config="key=environments/dev/terraform.tfstate" \
#     -backend-config="region=us-east-1" \
#     -backend-config="dynamodb_table=esquinazo-terraform-locks" \
#     -backend-config="encrypt=true"
#
# NOTE: Terraform does not merge configuration across directories - this file
# applies only to `infra/` itself, NOT to infra/environments/*. Each
# environment carries its own fully-specified backend (see
# infra/environments/dev/backend.tf).
###############################################################################

terraform {
  backend "s3" {}
}
