/**
 * Client for the Esquinazo API.
 *
 * The Lambda handlers wrap every payload as { data, meta }, where meta carries
 * the cache provenance (see apps/api/src/lib/http.ts). We unwrap `data` here so
 * components never see the envelope, but keep `meta` available for the cache
 * badge in the UI.
 *
 * In dev, requests go to /api and Vite proxies them, avoiding the CORS policy
 * that only allows the production origins.
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
export const API_BASE = import.meta.env.DEV ? "/api" : RAW_BASE || "https://api.esquinazo.io";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly upstreamStatus?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ResponseMeta {
  resource: string;
  source: "cache" | "upstream" | "stale-cache";
  cachedAt?: string;
  expiresAt?: number;
}

export interface Envelope<T> {
  data: T;
  meta: ResponseMeta;
}

type Query = Record<string, string | number | undefined>;

function buildUrl(path: string, query: Query = {}): string {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function apiGet<T>(path: string, query: Query = {}): Promise<Envelope<T>> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new ApiError(
      timedOut ? "The request took too long." : "Could not reach the server.",
      timedOut ? 504 : 0,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string; upstreamStatus?: number }
      | null;
    throw new ApiError(
      body?.error ?? `Request failed (${response.status}).`,
      response.status,
      body?.upstreamStatus,
    );
  }

  return (await response.json()) as Envelope<T>;
}

/* ------------------------------------------------------------------ *
 * Upstream shapes - partial mirrors of football-data.org v4, matching
 * the types in apps/api/src/lib/football-api.ts.
 * ------------------------------------------------------------------ */

export interface Team {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface Competition {
  id: number;
  name: string;
  code: string;
  emblem?: string;
}

export interface Score {
  winner?: string | null;
  fullTime?: { home: number | null; away: number | null };
  halfTime?: { home: number | null; away: number | null };
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number | null;
  stage?: string;
  competition?: Competition;
  homeTeam: Team;
  awayTeam: Team;
  score?: Score;
}

export interface MatchesResponse {
  competition?: Competition;
  resultSet?: { count: number };
  matches: Match[];
}

export interface StandingRow {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string | null;
}

export interface StandingsResponse {
  competition?: Competition;
  standings: Array<{
    stage: string;
    type: string;
    group?: string | null;
    table: StandingRow[];
  }>;
}

export interface Player {
  id: number;
  name: string;
  position?: string | null;
  dateOfBirth?: string;
  nationality?: string;
}

export interface SquadResponse extends Team {
  founded?: number;
  venue?: string;
  squad: Player[];
}

export interface Transfer {
  id?: number;
  date?: string;
  playerName?: string;
  sourceTeam?: Team | null;
  destinationTeam?: Team | null;
  type?: string;
}

export interface TransfersResponse {
  transfers: Transfer[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  publishedAt: string;
  source?: string;
  url?: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
}

/* ------------------------------------------------------------------ *
 * Endpoints
 * ------------------------------------------------------------------ */

/**
 * A type alias, not an interface: only aliases get an implicit index signature,
 * which is what lets this satisfy the Record<string, ...> query parameter.
 */
export type FixturesQuery = {
  competition?: string;
  matchday?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
};

export const getFixtures = (query: FixturesQuery = {}) =>
  apiGet<MatchesResponse>("/fixtures", query);

export const getStandings = (query: { competition?: string; matchday?: number } = {}) =>
  apiGet<StandingsResponse>("/standings", query);

/** The API exposes squads by team id: GET /players?team=<id>. */
export const getSquad = (teamId: number) => apiGet<SquadResponse>("/players", { team: teamId });

export const getTransfers = (personId: number) =>
  apiGet<TransfersResponse>("/transfers", { person: personId });

/**
 * No /news endpoint exists on the API yet. The call is wired so the page works
 * the moment one ships; until then it 404s and the page shows its empty state.
 */
export const getNews = () => apiGet<NewsResponse>("/news");

/* ------------------------------------------------------------------ *
 * Leagues offered in the filters. Codes are football-data.org's.
 * ------------------------------------------------------------------ */

export interface League {
  code: string;
  name: string;
  country: string;
}

export const LEAGUES: League[] = [
  { code: "PL", name: "Premier League", country: "England" },
  { code: "PD", name: "La Liga", country: "Spain" },
  { code: "SA", name: "Serie A", country: "Italy" },
  { code: "BL1", name: "Bundesliga", country: "Germany" },
  { code: "FL1", name: "Ligue 1", country: "France" },
  { code: "CL", name: "Champions League", country: "Europe" },
  { code: "DED", name: "Eredivisie", country: "Netherlands" },
  { code: "PPL", name: "Primeira Liga", country: "Portugal" },
];

export const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "LIVE"]);

export const isLive = (match: Match) => LIVE_STATUSES.has(match.status);
