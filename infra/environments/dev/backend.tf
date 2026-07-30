###############################################################################
# dev - remote state backend
#
# Points at the bucket and lock table created by infra/bootstrap. Backend
# blocks cannot reference variables or locals, so these values are literal;
# they come from `terraform output` in infra/bootstrap.
###############################################################################

terraform {
  backend "s3" {
    bucket         = "esquinazo-terraform-state-bgaculhn"
    key            = "environments/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "esquinazo-terraform-locks"
    encrypt        = true
  }
}
