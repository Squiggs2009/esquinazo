/**
 * GET /players/stats
 *
 * Query parameters:
 *   id      required, numeric player id
 *   season  required, four-digit year
 *
 * Returns every competition the player appeared in that season - the
 * provider has no per-league filter on this endpoint. A player transferred
 * or unused mid-season simply gets an empty `statistics` array rather than
 * an error.
 */
import { createResourceHandler, getQuery, requirePositiveInt, parseSeason, BadRequestError } from "../lib/http";
import { getPlayerStatistics } from "../lib/api-football";

/** A live season's numbers move every matchday; an hour is close enough. */
const TTL_SECONDS = 3_600;

export const handler = createResourceHandler({
  resource: "af:player:stats",

  parse: (event) => {
    const season = parseSeason(getQuery(event, "season"));
    if (season === undefined) {
      throw new BadRequestError("season is required");
    }

    return {
      id: requirePositiveInt(getQuery(event, "id"), "id"),
      season,
    };
  },

  fetch: async (params) => {
    const entry = await getPlayerStatistics(params.id, params.season);
    return { player: entry?.player ?? null, statistics: entry?.statistics ?? [] };
  },

  ttlSeconds: TTL_SECONDS,
});
