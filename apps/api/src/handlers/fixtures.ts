/**
 * GET /fixtures
 *
 * Query parameters:
 *   competition  competition code, default PL
 *   matchday     positive integer
 *   dateFrom     YYYY-MM-DD
 *   dateTo       YYYY-MM-DD
 *   status       SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED |
 *                POSTPONED | SUSPENDED | CANCELLED
 */
import {
  BadRequestError,
  createResourceHandler,
  getQuery,
  parseCompetition,
  parseDate,
  parseEnum,
  parsePositiveInt,
} from "../lib/http";
import {
  DEFAULT_COMPETITION,
  getFixtures,
  type MatchStatus,
} from "../lib/football-api";

const MATCH_STATUSES: readonly MatchStatus[] = [
  "SCHEDULED",
  "TIMED",
  "IN_PLAY",
  "PAUSED",
  "FINISHED",
  "POSTPONED",
  "SUSPENDED",
  "CANCELLED",
];

/** Short TTL: in-play scores go stale fast. */
const TTL_SECONDS = 60;

export const handler = createResourceHandler({
  resource: "fixtures",

  parse: (event) => {
    const competition =
      parseCompetition(getQuery(event, "competition")) ?? DEFAULT_COMPETITION;
    const matchday = parsePositiveInt(getQuery(event, "matchday"), "matchday");
    const dateFrom = parseDate(getQuery(event, "dateFrom"), "dateFrom");
    const dateTo = parseDate(getQuery(event, "dateTo"), "dateTo");
    const status = parseEnum(getQuery(event, "status"), MATCH_STATUSES, "status");

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestError("dateFrom must not be after dateTo");
    }

    return { competition, matchday, dateFrom, dateTo, status };
  },

  fetch: (params) =>
    getFixtures({
      competition: params.competition,
      ...(params.matchday === undefined ? {} : { matchday: params.matchday }),
      ...(params.dateFrom === undefined ? {} : { dateFrom: params.dateFrom }),
      ...(params.dateTo === undefined ? {} : { dateTo: params.dateTo }),
      ...(params.status === undefined ? {} : { status: params.status }),
    }),

  ttlSeconds: TTL_SECONDS,
});
