/**
 * GET /fixtures
 *
 * Two modes, on one route:
 *
 *   ?fixture=<id>  a single match with its events, lineups and statistics
 *   otherwise      the fixture list for a league and date window
 *
 * The detail mode lives here rather than on its own /match route because
 * upstream serves both from the same endpoint, and the cache key already
 * distinguishes them (`fixture=<id>` versus the league/date parameters).
 *
 * List parameters:
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
  parsePositiveInt,
  parseSeason,
} from "../lib/http";
import { DEFAULT_LEAGUE_ID, getFixtureDetail, getFixtures } from "../lib/api-football";

/** Short TTL: in-play scores and events go stale fast. */
const TTL_SECONDS = 60;

export const handler = createResourceHandler({
  resource: "af:fixtures",

  parse: (event) => {
    const fixture = parsePositiveInt(getQuery(event, "fixture"), "fixture");

    // One shape either way, with the unused half left undefined - cacheKey
    // drops undefined entries, so detail mode still keys on `fixture=<id>`
    // alone. Returning two different object shapes would union the type and
    // make `params` awkward to read in fetch.
    if (fixture !== undefined) {
      return {
        fixture,
        league: undefined,
        season: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        status: undefined,
      };
    }

    const league = parseLeagueId(getQuery(event, "league")) ?? DEFAULT_LEAGUE_ID;
    const season = parseSeason(getQuery(event, "season"));
    const dateFrom = parseDate(getQuery(event, "dateFrom"), "dateFrom");
    const dateTo = parseDate(getQuery(event, "dateTo"), "dateTo");
    const status = getQuery(event, "status");

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestError("dateFrom must not be after dateTo");
    }

    return { fixture: undefined, league, season, dateFrom, dateTo, status };
  },

  fetch: async (params) => {
    if (params.fixture !== undefined) {
      return { detail: await getFixtureDetail(params.fixture), fixtures: undefined };
    }

    const fixtures = await getFixtures({
      league: params.league ?? DEFAULT_LEAGUE_ID,
      ...(params.season === undefined ? {} : { season: params.season }),
      ...(params.dateFrom === undefined ? {} : { from: params.dateFrom }),
      ...(params.dateTo === undefined ? {} : { to: params.dateTo }),
      ...(params.status === undefined ? {} : { status: params.status }),
    });

    return { detail: undefined, fixtures };
  },

  ttlSeconds: TTL_SECONDS,
});
