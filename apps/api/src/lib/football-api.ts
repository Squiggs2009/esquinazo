/**
 * Client for football-data.org v4.
 *
 * Auth is a single `X-Auth-Token` header. The free tier allows 10 requests per
 * minute and returns 429 with a `Retry-After` header when you exceed it, so
 * this client retries 429s and 5xxs with backoff and gives up on 4xxs (which
 * will not fix themselves).
 *
 * Uses the runtime's global fetch (Node 18+), so there is no HTTP dependency.
 */

const DEFAULT_BASE_URL = "https://api.football-data.org/v4";
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_ATTEMPTS = 3;

export class FootballApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
    readonly body?: string,
  ) {
    super(message);
    this.name = "FootballApiError";
  }
}

function baseUrl(): string {
  return process.env.FOOTBALL_API_BASE_URL ?? DEFAULT_BASE_URL;
}

function apiKey(): string {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    throw new Error("FOOTBALL_DATA_API_KEY is not set");
  }
  return key;
}

/** Competition used when a request does not name one (Premier League). */
export const DEFAULT_COMPETITION = "PL";

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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    query = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    attempts = DEFAULT_ATTEMPTS,
  } = options;

  const url = buildUrl(path, query);
  let lastError: FootballApiError | undefined;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: Response | undefined;

    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Auth-Token": apiKey(),
          Accept: "application/json",
        },
        // Fresh signal per attempt - a consumed timeout cannot be reused.
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      const body = await response.text().catch(() => undefined);
      const retryable = response.status === 429 || response.status >= 500;

      lastError = new FootballApiError(
        `football-data.org responded ${response.status} for ${path}`,
        response.status,
        retryable,
        body,
      );

      if (!retryable) {
        throw lastError;
      }
    } catch (error) {
      if (error instanceof FootballApiError) {
        if (!error.retryable) {
          throw error;
        }
        lastError = error;
      } else {
        // Network failure or AbortSignal.timeout - both worth another go.
        const isTimeout = error instanceof Error && error.name === "TimeoutError";
        lastError = new FootballApiError(
          isTimeout
            ? `football-data.org timed out after ${timeoutMs}ms for ${path}`
            : `football-data.org request failed for ${path}: ${
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

  throw lastError ?? new FootballApiError(`Request failed for ${path}`, 502, true);
}

/*
 * Response shapes below cover the fields the handlers rely on. Upstream sends
 * considerably more per object and it is passed through untouched, so these are
 * deliberately partial rather than a full mirror of the provider's schema.
 */

export interface Area {
  id: number;
  name: string;
  code?: string;
}

export interface Competition {
  id: number;
  name: string;
  code: string;
  type?: string;
  emblem?: string;
}

export interface Team {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface Score {
  winner?: string | null;
  duration?: string;
  fullTime?: { home: number | null; away: number | null };
  halfTime?: { home: number | null; away: number | null };
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number | null;
  stage?: string;
  group?: string | null;
  competition?: Competition;
  homeTeam: Team;
  awayTeam: Team;
  score?: Score;
}

export interface MatchesResponse {
  competition?: Competition;
  filters?: Record<string, unknown>;
  resultSet?: { count: number; first?: string; last?: string };
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
  area?: Area;
  season?: Record<string, unknown>;
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

export interface TeamResponse extends Team {
  area?: Area;
  founded?: number;
  venue?: string;
  coach?: Record<string, unknown>;
  squad: Player[];
}

export interface Transfer {
  id?: number;
  date?: string;
  playerName?: string;
  sourceTeam?: Team | null;
  destinationTeam?: Team | null;
  fee?: Record<string, unknown> | null;
  type?: string;
}

export interface TransfersResponse {
  person?: Record<string, unknown>;
  transfers: Transfer[];
}

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELLED";

export interface FixturesParams {
  competition?: string;
  matchday?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: MatchStatus;
}

export function getFixtures(params: FixturesParams = {}): Promise<MatchesResponse> {
  const { competition = DEFAULT_COMPETITION, ...filters } = params;
  return request<MatchesResponse>(`/competitions/${competition}/matches`, {
    query: filters,
  });
}

export interface StandingsParams {
  competition?: string;
  season?: number;
  matchday?: number;
}

export function getStandings(params: StandingsParams = {}): Promise<StandingsResponse> {
  const { competition = DEFAULT_COMPETITION, ...filters } = params;
  return request<StandingsResponse>(`/competitions/${competition}/standings`, {
    query: filters,
  });
}

/** Squad list for a team - the closest thing v4 offers to a "players" feed. */
export function getSquad(teamId: number): Promise<TeamResponse> {
  return request<TeamResponse>(`/teams/${teamId}`);
}

export interface CompetitionTeamsResponse {
  competition?: Competition;
  teams: Team[];
}

export function getCompetitionTeams(
  competition: string = DEFAULT_COMPETITION,
): Promise<CompetitionTeamsResponse> {
  return request<CompetitionTeamsResponse>(`/competitions/${competition}/teams`);
}

/**
 * Transfer history for a person.
 *
 * NOTE: football-data.org gates this endpoint by subscription tier - on the
 * free plan it answers 403. The handler surfaces that as a 502 with the
 * upstream status rather than pretending the data exists. Confirm your plan
 * covers /persons/{id}/transfers before relying on the /transfers route.
 */
export function getTransfers(personId: number): Promise<TransfersResponse> {
  return request<TransfersResponse>(`/persons/${personId}/transfers`);
}
