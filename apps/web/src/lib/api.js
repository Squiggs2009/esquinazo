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
    constructor(message, status, upstreamStatus) {
        super(message);
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "upstreamStatus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: upstreamStatus
        });
        this.name = "ApiError";
    }
}
function buildUrl(path, query = {}) {
    const url = new URL(`${API_BASE}${path}`, window.location.origin);
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "")
            url.searchParams.set(key, String(value));
    }
    return url.toString();
}
export async function apiGet(path, query = {}) {
    let response;
    try {
        response = await fetch(buildUrl(path, query), {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(12000),
        });
    }
    catch (error) {
        const timedOut = error instanceof Error && error.name === "TimeoutError";
        throw new ApiError(timedOut ? "The request took too long." : "Could not reach the server.", timedOut ? 504 : 0);
    }
    if (!response.ok) {
        const body = (await response.json().catch(() => null));
        throw new ApiError(body?.error ?? `Request failed (${response.status}).`, response.status, body?.upstreamStatus);
    }
    return (await response.json());
}
/**
 * A player can appear in `statistics` more than once in the same season - a
 * loan move, a cup run alongside the league campaign. Prefers the entry for
 * the competition the caller actually cares about; falls back to the first
 * entry rather than none, since one wrong-competition stat line beats an
 * empty modal for a player who, say, only has cup appearances on record.
 */
export function statisticsForLeague(statistics, leagueId) {
    return statistics.find((entry) => entry.league.id === leagueId) ?? statistics[0];
}
/* ------------------------------------------------------------------ *
 * Media
 *
 * The API already returns absolute media URLs, so these are only used as a
 * fallback when a payload omits one.
 * ------------------------------------------------------------------ */
export const teamCrestUrl = (teamId) => `https://media.api-sports.io/football/teams/${teamId}.png`;
export const playerPhotoUrl = (playerId) => `https://media.api-sports.io/football/players/${playerId}.png`;
export const getFixtures = (query = {}) => apiGet("/fixtures", query);
/**
 * Every match on one date across all configured leagues, ordered by kick-off.
 * The API narrows the day's worldwide fixture list server-side, so this is a
 * short response rather than the ~1MB the provider returns.
 */
export const getFixturesByDate = (date) => apiGet("/fixtures", { date });
/**
 * One match with its events, lineups and statistics. Shares the /fixtures
 * route: upstream serves both from the same endpoint, so the API exposes the
 * detail behind a `fixture` parameter rather than a separate resource.
 */
export const getFixtureDetail = (fixtureId) => apiGet("/fixtures", { fixture: fixtureId });
export const getStandings = (query = {}) => apiGet("/standings", query);
/** The API exposes squads by team id: GET /players?team=<id>. */
export const getSquad = (teamId) => apiGet("/players", { team: teamId });
/** Season statistics for one player: GET /players/stats?id=<id>&season=<year>. */
export const getPlayerStatistics = (playerId, season) => apiGet("/players/stats", { id: playerId, season });
export const getTransfers = (playerId) => apiGet("/transfers", { player: playerId });
export const getNews = () => apiGet("/news");
/** Clubs in a competition, for the Players page's league-driven club picker. */
export const getTeams = (league, season) => apiGet("/teams", { league, ...(season === undefined ? {} : { season }) });
export const LEAGUES = [
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
    { id: 253, code: "MLS", name: "MLS", country: "United States" },
    { id: 772, code: "LCUP", name: "Leagues Cup", country: "North America" },
];
export const DEFAULT_LEAGUE_ID = 39;
/**
 * Short code for a league id, e.g. 39 -> "PL". Returns undefined for anything
 * not in LEAGUES so callers can omit the label rather than print a raw id -
 * the API only serves configured leagues, so this is drift insurance, not an
 * expected path.
 */
export const leagueCodeFor = (leagueId) => LEAGUES.find((l) => l.id === leagueId)?.code;
/**
 * Upstream short codes for a match in progress. HT/BT are breaks *within* a
 * live match, so they count as live; PST/CANC/SUSP/INT are not.
 */
export const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE"]);
export const isLive = (fixture) => LIVE_STATUSES.has(fixture.fixture.status.short);
