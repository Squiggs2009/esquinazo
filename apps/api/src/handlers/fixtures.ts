/**
 * GET /fixtures
 *
 * Three modes, on one route:
 *
 *   ?fixture=<id>  a single match with its events, lineups and statistics
 *   ?date=<date>   every match that day across all configured leagues
 *                  (the homepage rundown)
 *   otherwise      the fixture list for one league and date window
 *
 * They share a route because upstream serves all three from the same endpoint.
 * They do not share a cache partition: the date mode spans ten competitions
 * and is keyed `af:homepage:fixtures` / `date=<date>`, while the other two stay
 * under `af:fixtures`.
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
import {
  CONFIGURED_LEAGUE_IDS,
  DEFAULT_LEAGUE_ID,
  getFixtureDetail,
  getFixtures,
  getFixturesByDate,
  type Fixture,
} from "../lib/api-football";

/** Short TTL: in-play scores and events go stale fast. */
const TTL_SECONDS = 60;

const CONFIGURED = new Set(CONFIGURED_LEAGUE_IDS);

/**
 * Narrows a day's worldwide fixtures to the competitions the site covers and
 * orders them by kick-off. Filtering here rather than in the browser matters:
 * the unfiltered response is ~1.1MB of mostly irrelevant matches, and only the
 * narrowed list is what gets cached and sent on.
 */
function forHomepage(fixtures: Fixture[]): Fixture[] {
  return fixtures
    .filter((f) => CONFIGURED.has(f.league.id))
    .sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
}

export const handler = createResourceHandler({
  // The homepage rundown spans every league, so it earns its own partition
  // rather than sharing one keyed only by query string.
  resource: (params) => (params.date === undefined ? "af:fixtures" : "af:homepage:fixtures"),

  parse: (event) => {
    const fixture = parsePositiveInt(getQuery(event, "fixture"), "fixture");
    const date = parseDate(getQuery(event, "date"), "date");

    if (fixture !== undefined && date !== undefined) {
      throw new BadRequestError("fixture and date cannot be combined");
    }

    // One shape for every mode, with the unused fields left undefined -
    // cacheKey drops undefined entries, so each mode still keys on only what
    // it actually used. Returning different object shapes per branch would
    // union the type and make `params` awkward to read in fetch.
    if (fixture !== undefined || date !== undefined) {
      return {
        fixture,
        date,
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

    return { fixture: undefined, date: undefined, league, season, dateFrom, dateTo, status };
  },

  fetch: async (params) => {
    if (params.fixture !== undefined) {
      return { detail: await getFixtureDetail(params.fixture), fixtures: undefined };
    }

    if (params.date !== undefined) {
      return { detail: undefined, fixtures: forHomepage(await getFixturesByDate(params.date)) };
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
