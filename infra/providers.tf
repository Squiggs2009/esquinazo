###############################################################################
# Root provider requirements
#
# Baseline versions for the project. As with backend.tf, Terraform does not
# inherit this across directories: infra/environments/* and infra/modules/*
# declare their own equivalents, and this file is the reference they are kept
# in step with.
###############################################################################

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "us-east-1"
}

provider "aws" {
  region = var.aws_region
}
