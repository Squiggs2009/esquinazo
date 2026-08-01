/**
 * GET /fixtures
 *
 * Query parameters:
 *   league    API-Football league id, default 39 (Premier League)
 *   season    four-digit year; defaults to the league's current season
 *   dateFrom  YYYY-MM-DD
 *   dateTo    YYYY-MM-DD
 *   status    upstream short code (NS, 1H, HT, 2H, FT, PST, ...)
 */
import {
  BadRequestError,
  createResourceHandler,
  getQuery,
  parseDate,
  parseLeagueId,
  parseSeason,
} from "../lib/http";
import { DEFAULT_LEAGUE_ID, getFixtures } from "../lib/api-football";

/** Short TTL: in-play scores go stale fast. */
const TTL_SECONDS = 60;

export const handler = createResourceHandler({
  resource: "af:fixtures",

  parse: (event) => {
    const league = parseLeagueId(getQuery(event, "league")) ?? DEFAULT_LEAGUE_ID;
    const season = parseSeason(getQuery(event, "season"));
    const dateFrom = parseDate(getQuery(event, "dateFrom"), "dateFrom");
    const dateTo = parseDate(getQuery(event, "dateTo"), "dateTo");
    const status = getQuery(event, "status");

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestError("dateFrom must not be after dateTo");
    }

    return { league, season, dateFrom, dateTo, status };
  },

  fetch: async (params) => {
    const fixtures = await getFixtures({
      league: params.league,
      ...(params.season === undefined ? {} : { season: params.season }),
      ...(params.dateFrom === undefined ? {} : { from: params.dateFrom }),
      ...(params.dateTo === undefined ? {} : { to: params.dateTo }),
      ...(params.status === undefined ? {} : { status: params.status }),
    });

    return { fixtures };
  },

  ttlSeconds: TTL_SECONDS,
});
