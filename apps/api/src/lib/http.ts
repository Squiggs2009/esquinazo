/**
 * HTTP/Lambda adapter shared by the read handlers.
 *
 * API Gateway is configured with payload format 2.0 and owns CORS, so handlers
 * deliberately do not emit Access-Control-* headers - doing so would duplicate
 * them on the response.
 */
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";
import { FootballApiError } from "./football-api";
import {
  defaultTtlSeconds,
  errorMessage,
  withCache,
  type CacheParams,
  type CacheSource,
} from "./dynamodb";

/** Invalid client input - surfaced as 400 rather than retried. */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export interface JsonResponseOptions {
  statusCode?: number;
  headers?: Record<string, string>;
}

export function json(
  body: unknown,
  options: JsonResponseOptions = {},
): APIGatewayProxyResultV2 {
  const { statusCode = 200, headers = {} } = options;
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

function cacheControl(ttlSeconds: number, source: CacheSource): string {
  // A stale response should not be cached downstream for the full TTL.
  const maxAge = source === "stale-cache" ? Math.min(30, ttlSeconds) : ttlSeconds;
  return `public, max-age=${maxAge}, stale-while-revalidate=${ttlSeconds}`;
}

export function getQuery(
  event: APIGatewayProxyEventV2,
  name: string,
): string | undefined {
  const value = event.queryStringParameters?.[name];
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parsePositiveInt(
  raw: string | undefined,
  name: string,
): number | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new BadRequestError(`${name} must be a positive integer`);
  }
  return value;
}

export function requirePositiveInt(
  raw: string | undefined,
  name: string,
): number {
  const value = parsePositiveInt(raw, name);
  if (value === undefined) {
    throw new BadRequestError(`${name} is required`);
  }
  return value;
}

const COMPETITION_PATTERN = /^[A-Za-z0-9]{2,4}$/;

/** Competition codes look like PL, PD, BL1, CL - or a numeric id. */
export function parseCompetition(raw: string | undefined): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!COMPETITION_PATTERN.test(raw)) {
    throw new BadRequestError(
      "competition must be a 2-4 character code (e.g. PL, PD, BL1) or a numeric id",
    );
  }
  return raw.toUpperCase();
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(
  raw: string | undefined,
  name: string,
): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!DATE_PATTERN.test(raw) || Number.isNaN(Date.parse(raw))) {
    throw new BadRequestError(`${name} must be an ISO date (YYYY-MM-DD)`);
  }
  return raw;
}

export function parseEnum<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  name: string,
): T | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const upper = raw.toUpperCase() as T;
  if (!allowed.includes(upper)) {
    throw new BadRequestError(`${name} must be one of: ${allowed.join(", ")}`);
  }
  return upper;
}

export function toErrorResponse(
  error: unknown,
  requestId: string,
): APIGatewayProxyResultV2 {
  if (error instanceof BadRequestError) {
    return json({ error: error.message, requestId }, { statusCode: 400 });
  }

  if (error instanceof FootballApiError) {
    // Client errors from upstream usually mean a bad identifier was passed in.
    if (error.status === 404) {
      return json({ error: "Not found upstream", requestId }, { statusCode: 404 });
    }
    if (error.status === 429) {
      return json(
        { error: "Upstream rate limit reached, try again shortly", requestId },
        { statusCode: 429 },
      );
    }
    const statusCode = error.status === 504 ? 504 : 502;
    return json(
      {
        error: "Upstream provider error",
        upstreamStatus: error.status,
        requestId,
      },
      { statusCode },
    );
  }

  console.error("unhandled error", { requestId, error: errorMessage(error) });
  return json({ error: "Internal server error", requestId }, { statusCode: 500 });
}

export interface ResourceHandlerConfig<TParams extends CacheParams, TData> {
  /** Cache partition name, e.g. "fixtures". */
  resource: string;
  /** Validate and normalise the query string. Throw BadRequestError to reject. */
  parse: (event: APIGatewayProxyEventV2) => TParams;
  fetch: (params: TParams) => Promise<TData>;
  /** Cache lifetime; falls back to CACHE_TTL_SECONDS. */
  ttlSeconds?: number;
}

/**
 * Wires a resource into the cache-aside flow and maps failures onto status
 * codes, so each handler only declares its parameters and its upstream call.
 */
export function createResourceHandler<TParams extends CacheParams, TData>(
  config: ResourceHandlerConfig<TParams, TData>,
) {
  return async (
    event: APIGatewayProxyEventV2,
    context: Context,
  ): Promise<APIGatewayProxyResultV2> => {
    const requestId = context.awsRequestId;

    try {
      const params = config.parse(event);
      const ttlSeconds = config.ttlSeconds ?? undefined;

      const result = await withCache<TData>({
        resource: config.resource,
        params,
        ...(ttlSeconds === undefined ? {} : { ttlSeconds }),
        fetch: () => config.fetch(params),
      });

      // Must match what withCache actually applied, or the header lies.
      const effectiveTtl = ttlSeconds ?? defaultTtlSeconds();

      return json(
        {
          data: result.data,
          meta: {
            resource: config.resource,
            params,
            source: result.source,
            cachedAt: result.cachedAt,
            expiresAt: result.expiresAt,
          },
        },
        {
          headers: {
            "cache-control": cacheControl(effectiveTtl, result.source),
            "x-cache": result.source === "upstream" ? "MISS" : "HIT",
          },
        },
      );
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  };
}
