/**
 * GET /standings
 *
 * Query parameters:
 *   competition  competition code, default PL
 *   season       starting year of the season, e.g. 2024
 *   matchday     positive integer - standings as of that matchday
 */
import {
  createResourceHandler,
  getQuery,
  parseCompetition,
  parsePositiveInt,
} from "../lib/http";
import { DEFAULT_COMPETITION, getStandings } from "../lib/football-api";

/** Tables only move when matches finish. */
const TTL_SECONDS = 300;

export const handler = createResourceHandler({
  resource: "standings",

  parse: (event) => {
    const competition =
      parseCompetition(getQuery(event, "competition")) ?? DEFAULT_COMPETITION;
    const season = parsePositiveInt(getQuery(event, "season"), "season");
    const matchday = parsePositiveInt(getQuery(event, "matchday"), "matchday");

    return { competition, season, matchday };
  },

  fetch: (params) =>
    getStandings({
      competition: params.competition,
      ...(params.season === undefined ? {} : { season: params.season }),
      ...(params.matchday === undefined ? {} : { matchday: params.matchday }),
    }),

  ttlSeconds: TTL_SECONDS,
});
