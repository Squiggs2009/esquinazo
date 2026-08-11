/**
 * Client-side reads from Sanity for the Wire archive.
 *
 * Plain fetch rather than @sanity/client: the dataset is public (deliberately -
 * the Wire has to be crawlable), so there is no token to manage and no auth
 * flow to implement. One query against a documented URL is not worth ~40KB of
 * bundle on a page most visitors never open.
 *
 * This one *does* use the CDN host. Unlike the publish Lambda - which must read
 * the revision it was just told about - the archive is happy with cached data.
 */

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const DATASET = import.meta.env.VITE_SANITY_DATASET ?? "production";
const API_VERSION = import.meta.env.VITE_SANITY_API_VERSION ?? "2024-01-01";

/** True when the Wire is configured at all; lets the UI explain itself rather than error. */
export const wireConfigured = Boolean(PROJECT_ID);

export interface WireListEntry {
  _id: string;
  headline: string;
  slug: string;
  publishedAt: string;
  contentType?: "news" | "opinion" | null;
  language?: "en" | "es" | null;
  sourceLabel?: string | null;
}

const LIST_PROJECTION = `{
  _id,
  headline,
  "slug": coalesce(slug.current, slug),
  publishedAt,
  contentType,
  language,
  sourceLabel
}`;

export class WireError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "WireError";
  }
}

async function query<T>(groq: string, params: Record<string, string | number>): Promise<T> {
  if (!PROJECT_ID) {
    throw new WireError("The Wire is not configured (VITE_SANITY_PROJECT_ID is unset).", 0);
  }

  const url = new URL(
    `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}`,
  );
  url.searchParams.set("query", groq);
  // Sanity takes GROQ parameters as $-prefixed query params holding JSON.
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new WireError(
      timedOut ? "The request took too long." : "Could not reach the Wire.",
      timedOut ? 504 : 0,
    );
  }

  if (!response.ok) {
    throw new WireError(`The Wire responded ${response.status}.`, response.status);
  }

  const body = (await response.json()) as { result?: T };
  return (body.result ?? []) as T;
}

/**
 * Entries after the first `offset`. The static listing at /news already covers
 * the most recent ten, so the archive deliberately starts where that stops
 * rather than repeating them.
 */
export async function getArchiveEntries(offset: number, limit: number): Promise<WireListEntry[]> {
  return query<WireListEntry[]>(
    `*[_type == "wireEntry" && defined(slug.current) && defined(publishedAt)]
       | order(publishedAt desc)[$from...$to]${LIST_PROJECTION}`,
    { from: offset, to: offset + limit },
  );
}

/** Entries covered by the static page 1 - the archive starts after these. */
export const STATIC_PAGE_SIZE = 10;
export const ARCHIVE_PAGE_SIZE = 20;
