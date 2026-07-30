/**
 * GET /players
 *
 * Query parameters:
 *   team  required, numeric team id - returns that team's squad
 */
import { createResourceHandler, getQuery, requirePositiveInt } from "../lib/http";
import { getSquad } from "../lib/football-api";

/** Squads change on transfer days, not hourly. */
const TTL_SECONDS = 3_600;

export const handler = createResourceHandler({
  resource: "players",

  parse: (event) => ({
    team: requirePositiveInt(getQuery(event, "team"), "team"),
  }),

  fetch: (params) => getSquad(params.team),

  ttlSeconds: TTL_SECONDS,
});
