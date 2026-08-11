/**
 * POST /wire/publish
 *
 * Sanity webhook target. On publish of a wireEntry it regenerates that entry's
 * static page, refreshes page 1 of the listing, merges the URL into
 * sitemap.xml, and invalidates just the affected CloudFront paths.
 *
 * Unlike the read handlers this one does not use createResourceHandler: it is
 * a write path, not a cache-aside read, and it has a different contract -
 * requests are authenticated, the response is a summary rather than data, and
 * nothing here is cacheable.
 *
 * The pages it writes are only reachable because a CloudFront function
 * rewrites extensionless paths to /index.html (see infra/modules/s3-cloudfront).
 * The S3 origin is a REST endpoint, which does no directory-index resolution of
 * its own.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { json } from "../lib/http";
import { errorMessage } from "../lib/dynamodb";
import { getRecentWireEntries, getWireEntry, type WireEntry } from "../lib/sanity";
import {
  entryUrl,
  mergeSitemap,
  parseSitemap,
  renderEntryPage,
  renderListingPage,
  type RenderContext,
} from "../lib/wire-html";

/** Entries shown on the static page 1. Older ones stay client-side at /news/archive. */
const LISTING_SIZE = 10;

/** Rejects replayed webhook deliveries. Sanity's own tolerance is 5 minutes. */
const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;

const SITEMAP_KEY = "sitemap.xml";
const HTML_CACHE_CONTROL = "public, max-age=3600";

const s3 = new S3Client({});
const cloudfront = new CloudFrontClient({});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

/**
 * The exact bytes Sanity signed. API Gateway may hand the body over base64
 * encoded, and re-serialising the parsed JSON would change key order and
 * whitespace - the signature is over the raw payload, so it must be recovered
 * verbatim rather than rebuilt.
 */
function rawBody(event: APIGatewayProxyEventV2): string {
  if (event.body === undefined || event.body === null) return "";
  return event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
}

function headerValue(event: APIGatewayProxyEventV2, name: string): string | undefined {
  // API Gateway v2 lowercases header names, but not every test client does.
  const headers = event.headers ?? {};
  const direct = headers[name];
  if (direct !== undefined) return direct;
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  return match?.[1];
}

/** Constant-time compare that tolerates length mismatches without throwing. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export interface SignatureCheck {
  valid: boolean;
  reason?: string;
}

/**
 * Verifies Sanity's `sanity-webhook-signature` header, formatted as
 * `t=<millis>,v1=<base64url HMAC-SHA256 of "<t>.<body>">`.
 *
 * Exported so the signing scheme can be exercised directly - this is the one
 * piece here that cannot be sanity-checked by reading the rendered output.
 */
export function verifySignature(
  header: string | undefined,
  body: string,
  secret: string,
  now = Date.now(),
): SignatureCheck {
  if (!header) return { valid: false, reason: "missing signature header" };

  const parts = new Map(
    header
      .split(",")
      .map((part) => part.trim().split("="))
      .filter((pair): pair is [string, string] => pair.length === 2)
      .map(([key, value]) => [key.trim(), value.trim()]),
  );

  const timestamp = parts.get("t");
  const provided = parts.get("v1");
  if (!timestamp || !provided) return { valid: false, reason: "malformed signature header" };

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) return { valid: false, reason: "invalid signature timestamp" };
  if (Math.abs(now - issuedAt) > SIGNATURE_TOLERANCE_MS) {
    return { valid: false, reason: "signature timestamp outside tolerance" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("base64url");

  return safeEqual(expected, provided)
    ? { valid: true }
    : { valid: false, reason: "signature mismatch" };
}

async function readSitemap(bucket: string): Promise<string | null> {
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: SITEMAP_KEY }));
    return (await result.Body?.transformToString()) ?? null;
  } catch (error) {
    // First publish: nothing to merge into, so start a fresh sitemap. Any
    // other failure is surfaced rather than silently discarding the existing
    // file by overwriting it with a single-entry one.
    const name = (error as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
}

async function putHtml(bucket: string, key: string, body: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "text/html; charset=utf-8",
      CacheControl: HTML_CACHE_CONTROL,
    }),
  );
}

/**
 * Both the clean path and the rewritten one. The CloudFront function rewrites
 * at viewer-request, so the cache key is the /index.html form - but
 * invalidating the clean path too costs nothing and covers any request that
 * bypassed the rewrite.
 */
function invalidationPaths(slug: string): string[] {
  return [
    `/news/${slug}`,
    `/news/${slug}/index.html`,
    "/news",
    "/news/index.html",
    `/${SITEMAP_KEY}`,
  ];
}

export interface PublishSummary {
  slug: string;
  url: string;
  listingEntries: number;
  invalidation?: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2> => {
  const requestId = context.awsRequestId;

  try {
    const secret = requireEnv("SANITY_WEBHOOK_SECRET");
    const bucket = requireEnv("WEB_BUCKET_NAME");
    const distributionId = requireEnv("CLOUDFRONT_DISTRIBUTION_ID");
    const siteUrl = requireEnv("SITE_URL");
    // Not secrets - the same project id/dataset already ship inside the public
    // web bundle, since the browser needs them to query the (deliberately
    // public) dataset directly. Needed here only to build heroImage CDN URLs.
    const sanityProjectId = requireEnv("SANITY_PROJECT_ID");
    const sanityDataset = requireEnv("SANITY_DATASET");

    const body = rawBody(event);
    const check = verifySignature(headerValue(event, "sanity-webhook-signature"), body, secret);

    if (!check.valid) {
      // Deliberately vague to the caller, specific in the log.
      console.warn("rejected wire webhook", { requestId, reason: check.reason });
      return json({ error: "Invalid signature", requestId }, { statusCode: 401 });
    }

    let payload: { _id?: string; documentId?: string } = {};
    try {
      payload = body ? (JSON.parse(body) as typeof payload) : {};
    } catch {
      return json({ error: "Body is not valid JSON", requestId }, { statusCode: 400 });
    }

    const documentId = payload._id ?? payload.documentId;
    if (!documentId) {
      return json({ error: "Payload has no document id", requestId }, { statusCode: 400 });
    }

    // Drafts share a document id prefixed with "drafts."; they are not
    // published content and must never reach the public site.
    if (documentId.startsWith("drafts.")) {
      console.log("ignoring draft document", { requestId, documentId });
      return json({ status: "ignored", reason: "draft document", requestId });
    }

    const entry: WireEntry | null = await getWireEntry(documentId);
    if (!entry) {
      return json({ error: "Entry not found in Sanity", requestId }, { statusCode: 404 });
    }
    if (!entry.slug) {
      return json({ error: "Entry has no slug", requestId }, { statusCode: 422 });
    }

    const url = entryUrl(siteUrl, entry.slug);
    const renderCtx: RenderContext = { siteUrl, sanityProjectId, sanityDataset };

    await putHtml(bucket, `news/${entry.slug}/index.html`, renderEntryPage(entry, renderCtx));

    const recent = await getRecentWireEntries(LISTING_SIZE);
    await putHtml(bucket, "news/index.html", renderListingPage(recent, renderCtx));

    const existing = await readSitemap(bucket);
    const sitemap = mergeSitemap(existing ? parseSitemap(existing) : [], {
      loc: url,
      lastmod: entry.publishedAt,
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: SITEMAP_KEY,
        Body: sitemap,
        ContentType: "application/xml; charset=utf-8",
        CacheControl: HTML_CACHE_CONTROL,
      }),
    );

    const paths = invalidationPaths(entry.slug);
    const invalidation = await cloudfront.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `wire-${entry.slug}-${Date.now()}`,
          Paths: { Quantity: paths.length, Items: paths },
        },
      }),
    );

    const summary: PublishSummary = {
      slug: entry.slug,
      url,
      listingEntries: recent.length,
      ...(invalidation.Invalidation?.Id ? { invalidation: invalidation.Invalidation.Id } : {}),
    };

    console.log("wire page generated", { requestId, ...summary });
    return json({ status: "ok", ...summary, requestId });
  } catch (error) {
    console.error("wire generation failed", { requestId, error: errorMessage(error) });
    return json({ error: "Wire generation failed", requestId }, { statusCode: 500 });
  }
};
