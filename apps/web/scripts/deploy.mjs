#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const infraDir = path.resolve(__dirname, "../../../infra/environments/dev");
const distDir = path.resolve(__dirname, "../dist");

function tfOutput(name) {
  return execFileSync("terraform", [`-chdir=${infraDir}`, "output", "-raw", name], {
    encoding: "utf8",
  }).trim();
}

const bucket = tfOutput("web_bucket_name");
const distributionId = tfOutput("cloudfront_id");

console.log(`Syncing ${distDir} -> s3://${bucket}`);
execFileSync("aws", ["s3", "sync", distDir, `s3://${bucket}`, "--delete"], { stdio: "inherit" });

console.log(`Invalidating distribution ${distributionId}`);
execFileSync(
  "aws",
  ["cloudfront", "create-invalidation", "--distribution-id", distributionId, "--paths", "/*"],
  { stdio: "inherit" },
);
