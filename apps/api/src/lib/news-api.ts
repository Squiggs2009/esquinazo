/**
 * Client for NewsAPI.org's /v2/everything endpoint.
 *
 * NewsAPI's free "Developer" plan is documented as intended for development,
 * not production traffic, and may rate-limit or reject requests from a live
 * server. Confirm your plan actually covers this use - if it doesn't, this
 * fails the same way any other upstream error does here: caught, logged, and
 * degraded to an empty list by the handler rather than a 5xx (see
 * handlers/news.ts).
 */

const BASE_URL = "https://newsapi.org/v2/everything";
const DEFAULT_TIMEOUT_MS = 8_000;

export class NewsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "NewsApiError";
  }
}

function apiKey(): string {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    throw new Error("NEWS_API_KEY is not set");
  }
  return key;
}

interface RawSource {
  id: string | null;
  name: string;
}

interface RawArticle {
  source: RawSource | null;
  author: string | null;
  title: string;
  description: string | null;
  url: string | null;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface TopHeadlinesResponse {
  status: "ok" | "error";
  totalResults?: number;
  articles?: RawArticle[];
  code?: string;
  message?: string;
}

/** Shape the handler and cache layer operate on - upstream fields we don't use are dropped here. */
export interface Headline {
  title: string;
  summary?: string;
  publishedAt: string;
  source?: string;
  url?: string;
}

export interface TopHeadlinesParams {
  query?: string;
  pageSize?: number;
  language?: string;
  sortBy?: string;
}

export async function getTopHeadlines(params: TopHeadlinesParams = {}): Promise<Headline[]> {
  const { query = "football", pageSize = 10, language = "en", sortBy = "publishedAt" } = params;

  const url = new URL(BASE_URL);
  url.searchParams.set("qInTitle", query);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("language", language);
  url.searchParams.set("sortBy", sortBy);
  url.searchParams.set("apiKey", apiKey());

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new NewsApiError(
      timedOut
        ? `NewsAPI timed out after ${DEFAULT_TIMEOUT_MS}ms`
        : `NewsAPI request failed: ${error instanceof Error ? error.message : String(error)}`,
      timedOut ? 504 : 502,
    );
  }

  const body = (await response.json().catch(() => null)) as TopHeadlinesResponse | null;

  // NewsAPI sometimes answers HTTP 200 with { status: "error" } in the body -
  // response.ok alone is not sufficient to detect a failure.
  if (!response.ok || !body || body.status !== "ok") {
    throw new NewsApiError(
      body?.message ?? `NewsAPI responded ${response.status}`,
      response.status,
      body?.code,
    );
  }

  return (body.articles ?? [])
    // NewsAPI leaves takedown placeholders in results as the literal string
    // "[Removed]" for title/description/source instead of omitting the
    // article - filter those out rather than showing a broken-looking
    // headline that links nowhere useful.
    .filter((article) => article.title && article.title !== "[Removed]" && article.url)
    .map((article) => ({
      title: article.title,
      summary: article.description ?? undefined,
      publishedAt: article.publishedAt,
      source: article.source?.name ?? undefined,
      url: article.url ?? undefined,
    }));
}
