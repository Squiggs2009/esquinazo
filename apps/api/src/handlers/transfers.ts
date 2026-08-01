/**
 * GET /transfers
 *
 * Query parameters:
 *   player  required, numeric player id - returns that player's transfer history
 */
import { createResourceHandler, getQuery, requirePositiveInt } from "../lib/http";
import { getTransfers } from "../lib/api-football";

/** Transfer history is close to immutable once recorded. */
const TTL_SECONDS = 3_600;

export const handler = createResourceHandler({
  resource: "af:transfers",

  parse: (event) => ({
    player: requirePositiveInt(getQuery(event, "player"), "player"),
  }),

  fetch: async (params) => {
    const entries = await getTransfers(params.player);
    return { transfers: entries[0]?.transfers ?? [] };
  },

  ttlSeconds: TTL_SECONDS,
});
