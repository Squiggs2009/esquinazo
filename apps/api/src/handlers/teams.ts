/**
 * GET /teams
 *
 * Lists the clubs in a competition, backing the league-tab club picker on the
 * Players page. Query parameters:
 *
 *   competition  competition code, default PL
 */
import { createResourceHandler, getQuery, parseCompetition } from "../lib/http";
import { DEFAULT_COMPETITION, getCompetitionTeams } from "../lib/football-api";

/** Competition rosters change at promotion/relegation, not day to day. */
const TTL_SECONDS = 86_400;

export const handler = createResourceHandler({
  resource: "teams",

  parse: (event) => ({
    competition: parseCompetition(getQuery(event, "competition")) ?? DEFAULT_COMPETITION,
  }),

  fetch: (params) => getCompetitionTeams(params.competition),

  ttlSeconds: TTL_SECONDS,
});
