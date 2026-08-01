/**
 * GET /teams
 *
 * Lists the clubs in a competition, backing the league-tab club picker on the
 * Players page. Query parameters:
 *
 *   league  API-Football league id, default 39 (Premier League)
 *   season  four-digit year; defaults to the league's current season
 */
import { createResourceHandler, getQuery, parseLeagueId, parseSeason } from "../lib/http";
import { DEFAULT_LEAGUE_ID, getCompetitionTeams } from "../lib/api-football";

/** Competition rosters change at promotion/relegation, not day to day. */
const TTL_SECONDS = 86_400;

export const handler = createResourceHandler({
  resource: "af:teams",

  parse: (event) => ({
    league: parseLeagueId(getQuery(event, "league")) ?? DEFAULT_LEAGUE_ID,
    season: parseSeason(getQuery(event, "season")),
  }),

  fetch: async (params) => {
    const entries = await getCompetitionTeams({
      league: params.league,
      ...(params.season === undefined ? {} : { season: params.season }),
    });

    return { teams: entries };
  },

  ttlSeconds: TTL_SECONDS,
});
