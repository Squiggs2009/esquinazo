###############################################################################
# bootstrap - backend
#
# The bootstrap stack creates the S3 bucket and DynamoDB table that every other
# stack uses as its remote backend, so it cannot use that backend itself. Its
# state stays LOCAL and must be committed alongside this directory (or stored
# somewhere durable) - losing it means losing the handle on the state bucket.
#
# Do not convert this to an S3 backend.
###############################################################################

terraform {
  required_version = ">= 1.5.0"

  backend "local" {
    path = "./terraform.tfstate"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}
