/**
 * Client for the Esquinazo API.
 *
 * The Lambda handlers wrap every payload as { data, meta }, where meta carries
 * the cache provenance (see apps/api/src/lib/http.ts). We unwrap `data` here so
 * components never see the envelope, but keep `meta` available for the cache
 * badge in the UI.
 *
 * Types mirror API-Football v3 response shapes, which the handlers pass through
 * untouched rather than remapping.
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
 * Upstream shapes - partial mirrors of API-Football v3, matching the
 * types in apps/api/src/lib/api-football.ts.
 * ------------------------------------------------------------------ */

export interface Team {
  id: number;
  name: string;
  logo?: string;
  winner?: boolean | null;
}

export interface League {
  id: number;
  name: string;
  country?: string;
  logo?: string;
  flag?: string;
  season?: number;
  round?: string;
}

export interface FixtureStatus {
  long: string;
  short: string;
  elapsed?: number | null;
}

export interface Fixture {
  fixture: {
    id: number;
    referee?: string | null;
    date: string;
    timestamp?: number;
    venue?: { id?: number | null; name?: string | null; city?: string | null };
    status: FixtureStatus;
  };
  league: League;
  teams: { home: Team; away: Team };
  goals: { home: number | null; away: number | null };
  score?: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
    extratime?: { home: number | null; away: number | null };
    penalty?: { home: number | null; away: number | null };
  };
}

export interface FixturesResponse {
  fixtures: Fixture[];
}

/** A minute-level incident. `type` is "Goal" | "Card" | "subst" | "Var". */
export interface MatchEvent {
  time: { elapsed: number | null; extra?: number | null };
  team: Team;
  player?: { id?: number | null; name?: string | null };
  assist?: { id?: number | null; name?: string | null };
  type: string;
  detail?: string;
  comments?: string | null;
}

export interface LineupPlayer {
  player: {
    id: number;
    name: string;
    number?: number | null;
    /** "G" | "D" | "M" | "F". */
    pos?: string | null;
    /** "row:column" within the formation. Null for substitutes. */
    grid?: string | null;
  };
}

export interface Lineup {
  team: Team;
  formation?: string | null;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach?: { id?: number | null; name?: string | null; photo?: string | null };
}

export interface TeamStatistics {
  team: Team;
  statistics: Array<{ type: string; value: string | number | null }>;
}

export interface FixtureDetail extends Fixture {
  events?: MatchEvent[];
  lineups?: Lineup[];
  statistics?: TeamStatistics[];
}

export interface FixtureDetailResponse {
  detail: FixtureDetail | null;
}

export interface StandingRow {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group?: string;
  form?: string | null;
  description?: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface StandingsResponse {
  league?: League;
  /** One group per entry: a league has one, a cup has several. */
  standings: StandingRow[][];
}

export interface SquadPlayer {
  id: number;
  name: string;
  age?: number | null;
  number?: number | null;
  /**
   * Coarse only. API-Football's /players/squads reports exactly four values -
   * Goalkeeper, Defender, Midfielder, Attacker - never CB/LB/CDM/LW.
   */
  position?: string | null;
  photo?: string;
}

export interface SquadResponse {
  team: Team | null;
  players: SquadPlayer[];
}

export interface TeamEntry {
  team: Team & {
    code?: string | null;
    country?: string;
    founded?: number | null;
    national?: boolean;
  };
  venue?: {
    id?: number | null;
    name?: string | null;
    city?: string | null;
    capacity?: number | null;
  };
}

export interface TeamsResponse {
  teams: TeamEntry[];
}

export interface TransferMove {
  date?: string;
  type?: string | null;
  teams?: { in?: Team; out?: Team };
}

export interface TransfersResponse {
  transfers: TransferMove[];
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
 * Media
 *
 * The API already returns absolute media URLs, so these are only used as a
 * fallback when a payload omits one.
 * ------------------------------------------------------------------ */

export const teamCrestUrl = (teamId: number) =>
  `https://media.api-sports.io/football/teams/${teamId}.png`;

export const playerPhotoUrl = (playerId: number) =>
  `https://media.api-sports.io/football/players/${playerId}.png`;

/* ------------------------------------------------------------------ *
 * Endpoints
 * ------------------------------------------------------------------ */

/**
 * A type alias, not an interface: only aliases get an implicit index signature,
 * which is what lets this satisfy the Record<string, ...> query parameter.
 */
export type FixturesQuery = {
  league?: number;
  season?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
};

export const getFixtures = (query: FixturesQuery = {}) =>
  apiGet<FixturesResponse>("/fixtures", query);

/**
 * Every match on one date across all configured leagues, ordered by kick-off.
 * The API narrows the day's worldwide fixture list server-side, so this is a
 * short response rather than the ~1MB the provider returns.
 */
export const getFixturesByDate = (date: string) =>
  apiGet<FixturesResponse>("/fixtures", { date });

/**
 * One match with its events, lineups and statistics. Shares the /fixtures
 * route: upstream serves both from the same endpoint, so the API exposes the
 * detail behind a `fixture` parameter rather than a separate resource.
 */
export const getFixtureDetail = (fixtureId: number) =>
  apiGet<FixtureDetailResponse>("/fixtures", { fixture: fixtureId });

export const getStandings = (query: { league?: number; season?: number } = {}) =>
  apiGet<StandingsResponse>("/standings", query);

/** The API exposes squads by team id: GET /players?team=<id>. */
export const getSquad = (teamId: number) => apiGet<SquadResponse>("/players", { team: teamId });

export const getTransfers = (playerId: number) =>
  apiGet<TransfersResponse>("/transfers", { player: playerId });

export const getNews = () => apiGet<NewsResponse>("/news");

/** Clubs in a competition, for the Players page's league-driven club picker. */
export const getTeams = (league: number, season?: number) =>
  apiGet<TeamsResponse>("/teams", { league, ...(season === undefined ? {} : { season }) });

/* ------------------------------------------------------------------ *
 * Leagues offered in the filters. Ids are API-Football's.
 * ------------------------------------------------------------------ */

export interface LeagueOption {
  id: number;
  code: string;
  name: string;
  country: string;
}

export const LEAGUES: LeagueOption[] = [
  { id: 39, code: "PL", name: "Premier League", country: "England" },
  { id: 40, code: "ELC", name: "Championship", country: "England" },
  { id: 140, code: "PD", name: "La Liga", country: "Spain" },
  { id: 135, code: "SA", name: "Serie A", country: "Italy" },
  { id: 78, code: "BL1", name: "Bundesliga", country: "Germany" },
  { id: 61, code: "FL1", name: "Ligue 1", country: "France" },
  { id: 2, code: "UCL", name: "Champions League", country: "Europe" },
  { id: 88, code: "DED", name: "Eredivisie", country: "Netherlands" },
  { id: 94, code: "PPL", name: "Primeira Liga", country: "Portugal" },
  { id: 262, code: "MX", name: "Liga MX", country: "Mexico" },
];

export const DEFAULT_LEAGUE_ID = 39;

/**
 * Short code for a league id, e.g. 39 -> "PL". Returns undefined for anything
 * not in LEAGUES so callers can omit the label rather than print a raw id -
 * the API only serves configured leagues, so this is drift insurance, not an
 * expected path.
 */
export const leagueCodeFor = (leagueId: number): string | undefined =>
  LEAGUES.find((l) => l.id === leagueId)?.code;

/**
 * Upstream short codes for a match in progress. HT/BT are breaks *within* a
 * live match, so they count as live; PST/CANC/SUSP/INT are not.
 */
export const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE"]);

export const isLive = (fixture: Fixture) => LIVE_STATUSES.has(fixture.fixture.status.short);
