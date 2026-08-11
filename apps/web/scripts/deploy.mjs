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

// --delete still prunes stale build artifacts, but the Wire lives only in S3:
// its pages and sitemap are written by the generate-wire-page Lambda and never
// exist in dist/, so an unscoped --delete would wipe the whole archive on the
// next frontend deploy.
const syncExcludes = ["--exclude", "news/*", "--exclude", "sitemap.xml"];

console.log(`Syncing ${distDir} -> s3://${bucket}`);
execFileSync("aws", ["s3", "sync", distDir, `s3://${bucket}`, "--delete", ...syncExcludes], {
  stdio: "inherit",
});

console.log(`Invalidating distribution ${distributionId}`);
execFileSync(
  "aws",
  ["cloudfront", "create-invalidation", "--distribution-id", distributionId, "--paths", "/*"],
  { stdio: "inherit" },
);
