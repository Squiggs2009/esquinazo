/**
 * GET /standings
 *
 * Query parameters:
 *   league  API-Football league id, default 39 (Premier League)
 *   season  four-digit year; defaults to the league's current season
 *
 * `standings` is an array of groups: a league returns one, a cup returns one
 * per group.
 */
import { createResourceHandler, getQuery, parseLeagueId, parseSeason } from "../lib/http";
import { DEFAULT_LEAGUE_ID, getStandings } from "../lib/api-football";

/** Tables only move when matches finish. */
const TTL_SECONDS = 300;

export const handler = createResourceHandler({
  resource: "af:standings",

  parse: (event) => ({
    league: parseLeagueId(getQuery(event, "league")) ?? DEFAULT_LEAGUE_ID,
    season: parseSeason(getQuery(event, "season")),
  }),

  fetch: (params) =>
    getStandings({
      league: params.league,
      ...(params.season === undefined ? {} : { season: params.season }),
    }),

  ttlSeconds: TTL_SECONDS,
});
