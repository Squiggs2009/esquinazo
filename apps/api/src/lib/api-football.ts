/**
 * Client for API-Football (v3).
 *
 * Auth is two headers, `x-rapidapi-key` and `x-rapidapi-host`. Note the host:
 * this account holds a *direct* api-sports.io key, not a RapidAPI marketplace
 * subscription - the RapidAPI gateway answers "You are not subscribed to this
 * API" for it. The header *names* are the RapidAPI ones either way, which is
 * why they look mismatched against the direct host.
 *
 * Two upstream quirks drive the shape of this file:
 *
 *   1. API-Football answers HTTP 200 for application-level failures (bad key,
 *      unknown parameter, plan limits) and reports them in an `errors` field.
 *      A naive `response.ok` check would happily cache an error page, so every
 *      response body is inspected before it is accepted.
 *   2. `errors` is polymorphic - an empty array when fine, an object keyed by
 *      field when not - so it is normalised rather than truth-tested.
 *
 * Uses the runtime's global fetch (Node 18+), so there is no HTTP dependency.
 */

const DEFAULT_BASE_URL = "https://v3.football.api-sports.io";
const DEFAULT_HOST = "v3.football.api-sports.io";
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_ATTEMPTS = 3;

export class ApiFootballError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
    readonly body?: string,
  ) {
    super(message);
    this.name = "ApiFootballError";
  }
}

function baseUrl(): string {
  return process.env.API_FOOTBALL_BASE_URL ?? DEFAULT_BASE_URL;
}

function apiHost(): string {
  return process.env.API_FOOTBALL_HOST ?? DEFAULT_HOST;
}

function apiKey(): string {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error("API_FOOTBALL_KEY is not set");
  }
  return key;
}

export type QueryValue = string | number | undefined;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
  attempts?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry delay: honour Retry-After when the server sends it, otherwise
 * exponential backoff with jitter to avoid a thundering herd of Lambdas.
 */
function retryDelayMs(response: Response | undefined, attempt: number): number {
  const header = response?.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 30_000);
    }
  }
  const backoff = 2 ** (attempt - 1) * 500;
  return Math.min(backoff + Math.random() * 250, 10_000);
}

function buildUrl(path: string, query: Record<string, QueryValue> = {}): string {
  const url = new URL(`${baseUrl()}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** The envelope every API-Football endpoint wraps its payload in. */
interface ApiEnvelope<T> {
  get?: string;
  parameters?: Record<string, unknown>;
  errors?: unknown;
  results?: number;
  paging?: { current: number; total: number };
  response?: T[];
}

/**
 * Flattens API-Football's polymorphic `errors` into a list of messages.
 * Empty array (or absent) means success; an object means one message per key.
 */
function collectErrors(errors: unknown): string[] {
  if (errors === undefined || errors === null) return [];
  if (Array.isArray(errors)) {
    return errors.filter((e) => e !== null && e !== undefined).map((e) => String(e));
  }
  if (typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>).map(
      ([field, message]) => `${field}: ${String(message)}`,
    );
  }
  const text = String(errors);
  return text.length > 0 ? [text] : [];
}

/** True for upstream messages that reflect quota/rate state rather than a bad request. */
function looksRateLimited(messages: string[]): boolean {
  return messages.some((m) => /rate|limit|quota|too many/i.test(m));
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T[]> {
  const {
    query = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    attempts = DEFAULT_ATTEMPTS,
  } = options;

  const url = buildUrl(path, query);
  let lastError: ApiFootballError | undefined;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: Response | undefined;

    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey(),
          "x-rapidapi-host": apiHost(),
          Accept: "application/json",
        },
        // Fresh signal per attempt - a consumed timeout cannot be reused.
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => undefined);
        const retryable = response.status === 429 || response.status >= 500;

        lastError = new ApiFootballError(
          `API-Football responded ${response.status} for ${path}`,
          response.status,
          retryable,
          body,
        );

        if (!retryable) throw lastError;
      } else {
        const envelope = (await response.json()) as ApiEnvelope<T>;
        const messages = collectErrors(envelope.errors);

        // HTTP 200 with a populated `errors` field is still a failure.
        if (messages.length > 0) {
          const rateLimited = looksRateLimited(messages);
          lastError = new ApiFootballError(
            `API-Football reported an error for ${path}: ${messages.join("; ")}`,
            rateLimited ? 429 : 502,
            rateLimited,
            messages.join("; "),
          );
          if (!rateLimited) throw lastError;
        } else {
          return envelope.response ?? [];
        }
      }
    } catch (error) {
      if (error instanceof ApiFootballError) {
        if (!error.retryable) throw error;
        lastError = error;
      } else {
        // Network failure or AbortSignal.timeout - both worth another go.
        const isTimeout = error instanceof Error && error.name === "TimeoutError";
        lastError = new ApiFootballError(
          isTimeout
            ? `API-Football timed out after ${timeoutMs}ms for ${path}`
            : `API-Football request failed for ${path}: ${
                error instanceof Error ? error.message : String(error)
              }`,
          isTimeout ? 504 : 502,
          true,
        );
      }
    }

    if (attempt < attempts) {
      const delay = retryDelayMs(response, attempt);
      console.warn("retrying upstream request", {
        path,
        attempt,
        delay,
        reason: lastError?.message,
      });
      await sleep(delay);
    }
  }

  throw lastError ?? new ApiFootballError(`Request failed for ${path}`, 502, true);
}

/*
 * Response shapes below cover the fields the handlers rely on. Upstream sends
 * more per object and it is passed through untouched, so these are
 * deliberately partial rather than a full mirror of the provider's schema.
 */

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
    timezone?: string;
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
    /** "row:column" within the formation, e.g. "2:3". Null for substitutes. */
    grid?: string | null;
  };
}

export interface Lineup {
  team: Team & { colors?: unknown };
  formation?: string | null;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach?: { id?: number | null; name?: string | null; photo?: string | null };
}

export interface TeamStatistics {
  team: Team;
  statistics: Array<{ type: string; value: string | number | null }>;
}

/** A fixture plus everything /fixtures?id= embeds alongside it. */
export interface FixtureDetail extends Fixture {
  events?: MatchEvent[];
  lineups?: Lineup[];
  statistics?: TeamStatistics[];
}

export interface StandingRow {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group?: string;
  form?: string | null;
  status?: string;
  description?: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  home?: unknown;
  away?: unknown;
  update?: string;
}

export interface StandingsEntry {
  league: League & { standings: StandingRow[][] };
}

export interface SquadPlayer {
  id: number;
  name: string;
  age?: number | null;
  number?: number | null;
  /** Coarse only: "Goalkeeper" | "Defender" | "Midfielder" | "Attacker". */
  position?: string | null;
  photo?: string;
}

export interface SquadEntry {
  team: Team;
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

export interface LeagueSeason {
  year: number;
  start?: string;
  end?: string;
  current: boolean;
}

export interface LeagueEntry {
  league: League & { type?: string };
  country?: { name?: string; code?: string | null; flag?: string | null };
  seasons?: LeagueSeason[];
}

/** Premier League - the competition used when a request does not name one. */
export const DEFAULT_LEAGUE_ID = 39;

/**
 * The competitions this site surfaces. Mirrors LEAGUES in
 * apps/web/src/lib/api.ts and must stay in step with it: a date-scoped fetch
 * returns every fixture on earth for that day (~1,000 of them), and this is
 * what narrows it to the ones we actually show.
 */
export const CONFIGURED_LEAGUE_IDS: readonly number[] = [
  39, // Premier League
  40, // Championship
  140, // La Liga
  135, // Serie A
  78, // Bundesliga
  61, // Ligue 1
  2, // Champions League
  88, // Eredivisie
  94, // Primeira Liga
  262, // Liga MX
];

/* -------------------------------------------------------------------------
 * Season resolution.
 *
 * Every API-Football endpoint below is season-scoped, and the current season
 * cannot be derived from the date alone: European leagues roll over mid-year
 * while Liga MX runs Apertura/Clausura on its own calendar. So the provider is
 * asked which season it considers current, and the answer is memoised per
 * Lambda container - warm containers pay nothing, and a cold one spends a
 * single extra request. Deliberately process-local rather than a DynamoDB
 * entry: it is a small, self-healing optimisation, not shared state.
 * ---------------------------------------------------------------------- */

const SEASON_MEMO_TTL_MS = 6 * 60 * 60 * 1000;
const seasonMemo = new Map<number, { season: number; at: number }>();

export async function resolveSeason(leagueId: number): Promise<number> {
  const cached = seasonMemo.get(leagueId);
  if (cached && Date.now() - cached.at < SEASON_MEMO_TTL_MS) {
    return cached.season;
  }

  const entries = await request<LeagueEntry>("/leagues", { query: { id: leagueId } });
  const seasons = entries[0]?.seasons ?? [];
  const current = seasons.find((s) => s.current)?.year;

  // Fall back to the newest season on offer rather than failing outright: a
  // league between seasons still has a most-recent one worth showing.
  const newest = seasons.reduce<number | undefined>(
    (max, s) => (max === undefined || s.year > max ? s.year : max),
    undefined,
  );

  const season = current ?? newest;
  if (season === undefined) {
    throw new ApiFootballError(`No seasons available for league ${leagueId}`, 404, false);
  }

  seasonMemo.set(leagueId, { season, at: Date.now() });
  return season;
}

/* -------------------------------------------------------------------------
 * Endpoints
 * ---------------------------------------------------------------------- */

export interface FixturesParams {
  league?: number;
  season?: number;
  from?: string;
  to?: string;
  round?: string;
  status?: string;
}

export async function getFixtures(params: FixturesParams = {}): Promise<Fixture[]> {
  const league = params.league ?? DEFAULT_LEAGUE_ID;
  const season = params.season ?? (await resolveSeason(league));

  return request<Fixture>("/fixtures", {
    query: {
      league,
      season,
      ...(params.from === undefined ? {} : { from: params.from }),
      ...(params.to === undefined ? {} : { to: params.to }),
      ...(params.round === undefined ? {} : { round: params.round }),
      ...(params.status === undefined ? {} : { status: params.status }),
    },
  });
}

/**
 * One fixture with its events, lineups and statistics. Querying by id makes
 * the provider embed all three in the same payload, so a match page costs a
 * single upstream request rather than four.
 *
 * Those sections populate at different times: lineups roughly an hour before
 * kick-off, events and statistics as the match runs. An absent section means
 * "not published yet", not an error.
 */
export async function getFixtureDetail(fixtureId: number): Promise<FixtureDetail | null> {
  const entries = await request<FixtureDetail>("/fixtures", { query: { id: fixtureId } });
  return entries[0] ?? null;
}

/**
 * Every fixture on a given calendar date, across all competitions.
 *
 * Deliberately one request rather than one per league: the provider has no
 * multi-league filter, so the alternative is ten round trips against a daily
 * quota. The response is large (~1.1MB, ~1,000 fixtures) but arrives in well
 * under a second, and callers are expected to narrow it - see
 * CONFIGURED_LEAGUE_IDS - before anything is cached or returned.
 *
 * `date` is interpreted by the provider in UTC.
 */
export async function getFixturesByDate(date: string): Promise<Fixture[]> {
  return request<Fixture>("/fixtures", { query: { date } });
}

export interface StandingsParams {
  league?: number;
  season?: number;
}

/**
 * Returns the table groups for a competition. A league yields a single group;
 * a cup (Champions League) yields one per group, which is why this is an array
 * of arrays rather than a flat table.
 */
export async function getStandings(params: StandingsParams = {}): Promise<{
  league?: League;
  standings: StandingRow[][];
}> {
  const league = params.league ?? DEFAULT_LEAGUE_ID;
  const season = params.season ?? (await resolveSeason(league));

  const entries = await request<StandingsEntry>("/standings", {
    query: { league, season },
  });

  const entry = entries[0];
  if (!entry) return { standings: [] };

  const { standings, ...leagueMeta } = entry.league;
  return { league: leagueMeta, standings: standings ?? [] };
}

/** Squad list for a team. Positions are coarse - see SquadPlayer.position. */
export async function getSquad(teamId: number): Promise<SquadEntry | null> {
  const entries = await request<SquadEntry>("/players/squads", {
    query: { team: teamId },
  });
  return entries[0] ?? null;
}

export interface CompetitionTeamsParams {
  league?: number;
  season?: number;
}

export async function getCompetitionTeams(
  params: CompetitionTeamsParams = {},
): Promise<TeamEntry[]> {
  const league = params.league ?? DEFAULT_LEAGUE_ID;
  const season = params.season ?? (await resolveSeason(league));

  return request<TeamEntry>("/teams", { query: { league, season } });
}

export interface Transfer {
  player?: { id?: number; name?: string };
  update?: string;
  transfers?: Array<{
    date?: string;
    type?: string | null;
    teams?: { in?: Team; out?: Team };
  }>;
}

/** Transfer history for a player. */
export async function getTransfers(playerId: number): Promise<Transfer[]> {
  return request<Transfer>("/transfers", { query: { player: playerId } });
}

export interface PlayerProfile {
  id: number;
  name: string;
  age?: number | null;
  nationality?: string | null;
  photo?: string;
}

/**
 * One competition's worth of a player's season. A player who appeared for
 * more than one team/competition in the same season (a loan move, a cup run)
 * gets one of these per entry - see PlayerStatisticsEntry.
 */
export interface PlayerSeasonStatistics {
  team: Team;
  league: League;
  games?: {
    /** Sic - this is API-Football's actual field name, not a typo here. */
    appearences?: number | null;
    minutes?: number | null;
  };
  goals?: {
    total?: number | null;
    assists?: number | null;
  };
  passes?: {
    total?: number | null;
    key?: number | null;
    /** Already a percentage from the provider, e.g. "85" or "85%". */
    accuracy?: string | number | null;
  };
  tackles?: {
    total?: number | null;
  };
}

export interface PlayerStatisticsEntry {
  player: PlayerProfile;
  statistics: PlayerSeasonStatistics[];
}

/**
 * Season statistics for one player, across every competition they featured
 * in that season. Callers narrow `statistics` to the competition they care
 * about (see statisticsForLeague in apps/web/src/lib/api.ts) - the provider does not
 * offer a league filter on this endpoint, only id + season.
 */
export async function getPlayerStatistics(
  playerId: number,
  season: number,
): Promise<PlayerStatisticsEntry | null> {
  const entries = await request<PlayerStatisticsEntry>("/players", {
    query: { id: playerId, season },
  });
  return entries[0] ?? null;
}
