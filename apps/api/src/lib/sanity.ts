/**
 * Sanity client for the Wire.
 *
 * The `production` dataset is deliberately public - the content has to be
 * crawlable - so there is no read token here and none is needed.
 *
 * Note `useCdn: false`. The CDN (apicdn.sanity.io) serves cached responses,
 * and this client is driven by a publish webhook: the whole point is to read
 * the version that was just published. A cached read risks generating the page
 * from the *previous* revision, so the small latency cost of the uncached API
 * buys correctness here.
 */
import { createClient, type SanityClient } from "@sanity/client";

const DEFAULT_API_VERSION = "2024-01-01";

/** Portable Text span - the leaf node carrying actual text. */
export interface PortableTextSpan {
  _type?: string;
  text?: string;
  marks?: string[];
}

/** Portable Text block. Only the fields the renderer reads are declared. */
export interface PortableTextBlock {
  _type?: string;
  style?: string;
  children?: PortableTextSpan[];
}

/**
 * A published Wire entry.
 *
 * `body` is typed as a union because the schema's shape is not pinned down
 * here: Sanity's default rich-text field is Portable Text (an array of
 * blocks), but a plain string field is equally valid. The renderer handles
 * both rather than assuming one and silently producing an empty page.
 */
export interface WireEntry {
  _id: string;
  headline: string;
  slug: string;
  body?: PortableTextBlock[] | string | null;
  contentType?: "news" | "opinion" | null;
  language?: "en" | "es" | null;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  relatedPlayer?: { id?: number | null; name?: string | null } | null;
  relatedTeam?: { id?: number | null; name?: string | null; leagueId?: number | null } | null;
  publishedAt: string;
}

/**
 * Field projection shared by both queries. `slug.current` is flattened to a
 * plain string, and the related refs are projected defensively: they may be
 * references, inline objects, or absent depending on how the schema models
 * them, and coalesce keeps a missing field from failing the whole query.
 */
const ENTRY_PROJECTION = `{
  _id,
  headline,
  "slug": coalesce(slug.current, slug),
  body,
  contentType,
  language,
  sourceLabel,
  sourceUrl,
  "relatedPlayer": relatedPlayer{ "id": coalesce(playerId, id), "name": coalesce(name, playerName) },
  "relatedTeam": relatedTeam{ "id": coalesce(teamId, id), "name": coalesce(name, teamName), leagueId },
  publishedAt
}`;

let cached: SanityClient | undefined;

export function sanityClient(): SanityClient {
  if (cached) return cached;

  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;

  if (!projectId) throw new Error("SANITY_PROJECT_ID is not set");
  if (!dataset) throw new Error("SANITY_DATASET is not set");

  cached = createClient({
    projectId,
    dataset,
    apiVersion: process.env.SANITY_API_VERSION ?? DEFAULT_API_VERSION,
    useCdn: false,
    perspective: "published",
  });

  return cached;
}

/** One entry by document id. Null when the id does not resolve. */
export async function getWireEntry(id: string): Promise<WireEntry | null> {
  return sanityClient().fetch<WireEntry | null>(
    `*[_type == "wireEntry" && _id == $id][0]${ENTRY_PROJECTION}`,
    { id },
  );
}

/**
 * Most recent entries, newest first. Only entries with a slug and a
 * publishedAt are eligible: without a slug there is no URL to link to, and
 * without a date the ordering is meaningless.
 */
export async function getRecentWireEntries(limit: number): Promise<WireEntry[]> {
  return sanityClient().fetch<WireEntry[]>(
    `*[_type == "wireEntry" && defined(slug.current) && defined(publishedAt)]
       | order(publishedAt desc)[0...$limit]${ENTRY_PROJECTION}`,
    { limit },
  );
}
