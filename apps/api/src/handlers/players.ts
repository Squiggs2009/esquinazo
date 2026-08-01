/**
 * GET /players
 *
 * Query parameters:
 *   team  required, numeric team id - returns that team's squad
 *
 * Note the upstream limitation: /players/squads reports only four coarse
 * positions (Goalkeeper, Defender, Midfielder, Attacker), not the granular
 * CB/LB/CDM/LW set. The UI groups by these four rather than inventing detail
 * the provider does not supply.
 */
import { createResourceHandler, getQuery, requirePositiveInt } from "../lib/http";
import { getSquad } from "../lib/api-football";

/** Squads change on transfer days, not hourly. */
const TTL_SECONDS = 3_600;

export const handler = createResourceHandler({
  resource: "af:players",

  parse: (event) => ({
    team: requirePositiveInt(getQuery(event, "team"), "team"),
  }),

  fetch: async (params) => {
    const entry = await getSquad(params.team);
    return { team: entry?.team ?? null, players: entry?.players ?? [] };
  },

  ttlSeconds: TTL_SECONDS,
});
