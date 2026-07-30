/**
 * GET /transfers
 *
 * Query parameters:
 *   person  required, numeric person id - returns that player's transfer history
 *
 * football-data.org gates /persons/{id}/transfers by subscription tier; on the
 * free plan this route answers 502 with upstreamStatus 403. See getTransfers in
 * lib/football-api.ts.
 */
import { createResourceHandler, getQuery, requirePositiveInt } from "../lib/http";
import { getTransfers } from "../lib/football-api";

/** Transfer history is close to immutable once recorded. */
const TTL_SECONDS = 3_600;

export const handler = createResourceHandler({
  resource: "transfers",

  parse: (event) => ({
    person: requirePositiveInt(getQuery(event, "person"), "person"),
  }),

  fetch: (params) => getTransfers(params.person),

  ttlSeconds: TTL_SECONDS,
});
