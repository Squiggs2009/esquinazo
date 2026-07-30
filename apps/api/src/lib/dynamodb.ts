/**
 * DynamoDB cache layer.
 *
 * Single table, keyed PK/SK, with an `expires_at` TTL attribute (epoch
 * seconds) matching the dynamodb Terraform module.
 *
 * Two behaviours worth knowing about:
 *
 *   1. DynamoDB's TTL sweeper can lag by up to 48 hours, so an expired item is
 *      still readable long after it should be gone. Every read therefore checks
 *      `expires_at` itself and treats a lapsed item as a miss.
 *   2. The cache is an optimisation, never a dependency. If DynamoDB errors we
 *      log and fall through to the upstream API rather than failing the
 *      request.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const DEFAULT_TTL_SECONDS = 300;

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    // Lambda sets AWS_REGION; the SDK picks it up automatically.
    maxAttempts: 3,
  }),
  {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  },
);

function tableName(): string {
  const name = process.env.CACHE_TABLE_NAME;
  if (!name) {
    throw new Error("CACHE_TABLE_NAME is not set");
  }
  return name;
}

/** Cache lifetime used when a caller does not specify one. */
export function defaultTtlSeconds(): number {
  const raw = process.env.CACHE_TTL_SECONDS;
  const parsed = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_SECONDS;
}

export type CacheParams = Record<string, string | number | boolean | undefined>;

export interface CacheKey {
  PK: string;
  SK: string;
}

/**
 * Builds a deterministic key for a resource + query combination. Parameters are
 * sorted and undefined values dropped so that `?a=1&b=2` and `?b=2&a=1` share
 * one cache entry.
 */
export function cacheKey(resource: string, params: CacheParams = {}): CacheKey {
  const canonical = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");

  return {
    PK: `RESOURCE#${resource.toUpperCase()}`,
    SK: canonical.length > 0 ? canonical : "ALL",
  };
}

interface CacheItem<T> extends CacheKey {
  value: T;
  cached_at: string;
  expires_at: number;
}

export interface CacheHit<T> {
  value: T;
  cachedAt: string;
  expiresAt: number;
  /** True when the entry is past expires_at but has not been swept yet. */
  stale: boolean;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Reads an entry. Returns null on a miss; returns a hit with `stale: true` for
 * an entry that has expired but not yet been deleted, letting callers decide
 * whether to serve it.
 */
export async function getCached<T>(
  resource: string,
  params: CacheParams = {},
): Promise<CacheHit<T> | null> {
  const key = cacheKey(resource, params);

  try {
    const result = await client.send(
      new GetCommand({
        TableName: tableName(),
        Key: key,
        // Cache reads are not worth the doubled cost of a strong read.
        ConsistentRead: false,
      }),
    );

    const item = result.Item as CacheItem<T> | undefined;
    if (!item) {
      return null;
    }

    return {
      value: item.value,
      cachedAt: item.cached_at,
      expiresAt: item.expires_at,
      stale: item.expires_at <= nowSeconds(),
    };
  } catch (error) {
    console.error("cache read failed", {
      resource,
      key,
      error: errorMessage(error),
    });
    return null;
  }
}

/**
 * Writes an entry with a TTL. Failures are logged and swallowed: losing a cache
 * write must not fail a request that already has its data.
 */
export async function putCached<T>(
  resource: string,
  params: CacheParams,
  value: T,
  ttlSeconds: number = defaultTtlSeconds(),
): Promise<void> {
  const key = cacheKey(resource, params);
  const item: CacheItem<T> = {
    ...key,
    value,
    cached_at: new Date().toISOString(),
    expires_at: nowSeconds() + ttlSeconds,
  };

  try {
    await client.send(
      new PutCommand({ TableName: tableName(), Item: item }),
    );
  } catch (error) {
    console.error("cache write failed", {
      resource,
      key,
      error: errorMessage(error),
    });
  }
}

export type CacheSource = "cache" | "upstream" | "stale-cache";

export interface CachedResult<T> {
  data: T;
  source: CacheSource;
  cachedAt?: string;
  expiresAt?: number;
}

export interface WithCacheOptions<T> {
  resource: string;
  params?: CacheParams;
  ttlSeconds?: number;
  fetch: () => Promise<T>;
  /**
   * Serve an expired entry when the upstream call fails. Better a few minutes
   * out of date than a 502 for a stats page.
   */
  allowStaleOnError?: boolean;
  /** Skip the read and force a refresh. Used by the scheduled warmer. */
  forceRefresh?: boolean;
}

/**
 * Cache-aside read: fresh cache entry, else upstream (then cached), else stale
 * cache entry if one exists and the caller allows it.
 */
export async function withCache<T>(
  options: WithCacheOptions<T>,
): Promise<CachedResult<T>> {
  const {
    resource,
    params = {},
    ttlSeconds = defaultTtlSeconds(),
    fetch: fetchUpstream,
    allowStaleOnError = true,
    forceRefresh = false,
  } = options;

  const existing = forceRefresh ? null : await getCached<T>(resource, params);

  if (existing && !existing.stale) {
    return {
      data: existing.value,
      source: "cache",
      cachedAt: existing.cachedAt,
      expiresAt: existing.expiresAt,
    };
  }

  try {
    const data = await fetchUpstream();
    await putCached(resource, params, data, ttlSeconds);
    return {
      data,
      source: "upstream",
      expiresAt: nowSeconds() + ttlSeconds,
    };
  } catch (error) {
    // A stale entry beats an error page.
    const fallback = existing ?? (forceRefresh ? await getCached<T>(resource, params) : null);

    if (allowStaleOnError && fallback) {
      console.warn("serving stale cache after upstream failure", {
        resource,
        params,
        error: errorMessage(error),
      });
      return {
        data: fallback.value,
        source: "stale-cache",
        cachedAt: fallback.cachedAt,
        expiresAt: fallback.expiresAt,
      };
    }

    throw error;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
