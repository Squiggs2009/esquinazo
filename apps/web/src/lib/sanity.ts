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

/** A Sanity image field value - just enough of it to build a thumbnail URL. */
export interface SanityImage {
  asset?: { _ref?: string | null } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  alt?: string | null;
}

export interface WireListEntry {
  _id: string;
  headline: string;
  slug: string;
  publishedAt: string;
  contentType?: "news" | "opinion" | null;
  language?: "en" | "es" | null;
  sourceLabel?: string | null;
  heroImage?: SanityImage | null;
}

const LIST_PROJECTION = `{
  _id,
  headline,
  "slug": coalesce(slug.current, slug),
  publishedAt,
  contentType,
  language,
  sourceLabel,
  heroImage
}`;

const ASSET_REF_RE = /^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/;

/**
 * A center-cropped square thumbnail, built straight from the asset ref rather
 * than via @sanity/image-url. Home ships eagerly - unlike the archive, it is
 * not lazy-loaded - so this deliberately avoids adding a dependency to the
 * highest-traffic page's bundle for one small thumbnail. Honors a manual crop
 * the editor drew in Studio; does not use hotspot, which needs the library's
 * centering math to do properly. A plain center-square crop is a reasonable
 * trade for a single small thumbnail - the Wire listing page (server-rendered
 * by the generate-wire-page Lambda, which does depend on the library) still
 * gets the fully hotspot-aware version.
 *
 * The explicit rect is deliberate, not incidental: Sanity's own crop when
 * `rect` is omitted is not documented as a guaranteed center crop, and
 * checking it against a real asset produced different output bytes than an
 * explicit whole-image rect. Computing the rect ourselves is the only way to
 * get a predictable, testable result.
 */
export function wireEntryThumbnailUrl(
  image: SanityImage | null | undefined,
  size: number,
): string | null {
  const ref = image?.asset?._ref;
  const match = ref ? ASSET_REF_RE.exec(ref) : null;
  if (!PROJECT_ID || !match) return null;

  const [, assetId, rawWidth, rawHeight, format] = match;
  let width = Number(rawWidth);
  let height = Number(rawHeight);
  let left = 0;
  let top = 0;

  const crop = image?.crop;
  if (crop) {
    left = Math.round(width * (crop.left ?? 0));
    top = Math.round(height * (crop.top ?? 0));
    width = Math.round(width * (1 - (crop.left ?? 0) - (crop.right ?? 0)));
    height = Math.round(height * (1 - (crop.top ?? 0) - (crop.bottom ?? 0)));
  }

  // Center-square within whatever the (possibly crop-trimmed) region is.
  const side = Math.min(width, height);
  left += Math.round((width - side) / 2);
  top += Math.round((height - side) / 2);

  const url = new URL(
    `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${assetId}-${rawWidth}x${rawHeight}.${format}`,
  );
  url.searchParams.set("rect", `${left},${top},${side},${side}`);
  url.searchParams.set("w", String(size));
  url.searchParams.set("h", String(size));
  url.searchParams.set("fit", "crop");
  url.searchParams.set("auto", "format");
  return url.toString();
}

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

/** The most recent entries, for the homepage's "Esquinazo News" module. */
export async function getLatestWireEntries(limit: number): Promise<WireListEntry[]> {
  return query<WireListEntry[]>(
    `*[_type == "wireEntry" && defined(slug.current) && defined(publishedAt)]
       | order(publishedAt desc)[0...$limit]${LIST_PROJECTION}`,
    { limit },
  );
}

/** Entries covered by the static page 1 - the archive starts after these. */
export const STATIC_PAGE_SIZE = 10;
export const ARCHIVE_PAGE_SIZE = 20;
