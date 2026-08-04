/**
 * GET /news
 *
 * Football headlines from NewsAPI.org, cached in DynamoDB for TTL_SECONDS.
 *
 * This handler does not use createResourceHandler/withCache like the other
 * resources: it has its own DynamoDB schema (one item per article - see
 * getCachedHeadlines/putCachedHeadlines in lib/dynamodb.ts) and, more
 * importantly, a different failure contract. An upstream failure here is
 * never surfaced as a 5xx - it degrades to an empty article list, because the
 * frontend's Headlines component already treats an empty array as "nothing
 * to show" and simply does not render the section. An error page for content
 * nobody navigated here by name to see would be worse than no section at all.
 */
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { json } from "../lib/http";
import { errorMessage, getCachedHeadlines, putCachedHeadlines } from "../lib/dynamodb";
import { getTopHeadlines, type Headline } from "../lib/news-api";

const TTL_SECONDS = 3600;

/** Exact NewsAPI query - also selects the cache partition (see getCachedHeadlines/putCachedHeadlines). */
const QUERY_STRING =
  'soccer OR "premier league" OR "champions league" OR "la liga" OR "serie a" OR bundesliga OR "world cup" OR "euro" OR "fa cup" OR "ligue 1" OR "copa del rey" OR "carabao cup"';

interface ResponseArticle {
  id: string;
  title: string;
  summary?: string;
  publishedAt: string;
  source?: string;
  url?: string;
  imageUrl?: string;
}

/** Adds the `id` the frontend's NewsArticle type requires - a caching/upstream concern neither layer below owns. */
function toResponseArticles(headlines: Headline[]): ResponseArticle[] {
  return headlines.map((headline, index) => ({
    id: headline.url ?? `headline-${index}`,
    ...headline,
  }));
}

export const handler = async (
  _event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2> => {
  const requestId = context.awsRequestId;
  const cached = await getCachedHeadlines(QUERY_STRING);

  if (cached && !cached.stale) {
    return json(
      {
        data: { articles: toResponseArticles(cached.articles) },
        meta: { resource: "news", source: "cache", cachedAt: cached.cachedAt, expiresAt: cached.expiresAt },
      },
      {
        headers: {
          "cache-control": `public, max-age=${TTL_SECONDS}`,
          "x-cache": "HIT",
        },
      },
    );
  }

  try {
    const headlines = await getTopHeadlines({
      query: QUERY_STRING,
      pageSize: 10,
      language: "en",
    });
    await putCachedHeadlines(headlines, TTL_SECONDS, QUERY_STRING);

    return json(
      {
        data: { articles: toResponseArticles(headlines) },
        meta: { resource: "news", source: "upstream" },
      },
      {
        headers: {
          "cache-control": `public, max-age=${TTL_SECONDS}`,
          "x-cache": "MISS",
        },
      },
    );
  } catch (error) {
    console.error("news fetch failed", { requestId, error: errorMessage(error) });

    // A past-TTL cache still beats an empty page - only fall all the way
    // back to an empty array when there is truly nothing on hand. This is a
    // deliberate addition beyond "return empty array": it mirrors the
    // stale-beats-nothing rule the rest of the API already applies (see
    // withCache's allowStaleOnError in lib/dynamodb.ts).
    if (cached) {
      return json(
        {
          data: { articles: toResponseArticles(cached.articles) },
          meta: { resource: "news", source: "stale-cache", cachedAt: cached.cachedAt, expiresAt: cached.expiresAt },
        },
        {
          headers: {
            "cache-control": "public, max-age=60",
            "x-cache": "STALE",
          },
        },
      );
    }

    return json(
      {
        data: { articles: [] },
        meta: { resource: "news", source: "upstream" },
      },
      {
        headers: {
          "cache-control": "public, max-age=60",
          "x-cache": "MISS",
        },
      },
    );
  }
};
