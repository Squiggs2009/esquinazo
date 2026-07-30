/**
 * Scheduled cache warmer, invoked by EventBridge every 5 minutes.
 *
 * Rewrites the cache entries the read handlers look up, so visitor requests hit
 * a warm cache instead of paying for the upstream round trip.
 *
 * Two constraints shape this handler:
 *
 *   - football-data.org's free tier allows 10 requests per minute. Targets are
 *     fetched sequentially with a pause between them rather than in parallel,
 *     and REFRESH_COMPETITIONS defaults to two competitions (4 requests).
 *   - The function has a 60s timeout. It checks remaining time before each
 *     target and stops cleanly instead of being killed mid-write.
 *
 * Cache keys here MUST match what the read handlers compute, otherwise the
 * warmer fills entries nobody reads. Both go through withCache/cacheKey with
 * the same resource name and parameter object.
 */
import type { Context, ScheduledEvent } from "aws-lambda";
import { errorMessage, withCache } from "../lib/dynamodb";
import {
  DEFAULT_COMPETITION,
  getFixtures,
  getStandings,
} from "../lib/football-api";

/** Keep in step with the TTLs in the fixtures/standings handlers. */
const FIXTURES_TTL_SECONDS = 60;
const STANDINGS_TTL_SECONDS = 300;

const DEFAULT_DELAY_MS = 1_200;
/** Leave room to finish the in-flight write and return a summary. */
const TIME_BUFFER_MS = 8_000;

interface RefreshTarget {
  resource: "fixtures" | "standings";
  params: { competition: string };
  ttlSeconds: number;
  fetch: () => Promise<unknown>;
}

interface TargetOutcome {
  resource: string;
  competition: string;
  status: "refreshed" | "failed" | "skipped";
  error?: string;
}

function competitions(): string[] {
  const raw = process.env.REFRESH_COMPETITIONS;
  if (!raw) {
    return [DEFAULT_COMPETITION, "PD"];
  }
  return raw
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code.length > 0);
}

function delayMs(): number {
  const parsed = Number(process.env.REFRESH_DELAY_MS);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_DELAY_MS;
}

function buildTargets(): RefreshTarget[] {
  return competitions().flatMap((competition) => [
    {
      resource: "fixtures" as const,
      params: { competition },
      ttlSeconds: FIXTURES_TTL_SECONDS,
      fetch: () => getFixtures({ competition }),
    },
    {
      resource: "standings" as const,
      params: { competition },
      ttlSeconds: STANDINGS_TTL_SECONDS,
      fetch: () => getStandings({ competition }),
    },
  ]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RefreshSummary {
  refreshed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  results: TargetOutcome[];
}

export const handler = async (
  _event: ScheduledEvent,
  context: Context,
): Promise<RefreshSummary> => {
  const startedAt = Date.now();
  const targets = buildTargets();
  const results: TargetOutcome[] = [];
  const pause = delayMs();

  for (const [index, target] of targets.entries()) {
    const { resource, params } = target;

    if (context.getRemainingTimeInMillis() < TIME_BUFFER_MS) {
      // Out of time: mark the rest skipped rather than risk a mid-write kill.
      results.push(
        ...targets.slice(index).map((remaining) => ({
          resource: remaining.resource,
          competition: remaining.params.competition,
          status: "skipped" as const,
        })),
      );
      console.warn("refresh stopped early, out of time", {
        completed: index,
        total: targets.length,
      });
      break;
    }

    try {
      // forceRefresh bypasses the read so a warm-but-live entry is still
      // rewritten; allowStaleOnError is off because a failure here should be
      // reported, not papered over with the entry we already had.
      await withCache({
        resource,
        params,
        ttlSeconds: target.ttlSeconds,
        fetch: target.fetch,
        forceRefresh: true,
        allowStaleOnError: false,
      });

      results.push({
        resource,
        competition: params.competition,
        status: "refreshed",
      });
    } catch (error) {
      const message = errorMessage(error);
      console.error("refresh target failed", {
        resource,
        competition: params.competition,
        error: message,
      });
      results.push({
        resource,
        competition: params.competition,
        status: "failed",
        error: message,
      });
    }

    if (index < targets.length - 1 && pause > 0) {
      await sleep(pause);
    }
  }

  const summary: RefreshSummary = {
    refreshed: results.filter((r) => r.status === "refreshed").length,
    failed: results.filter((r) => r.status === "failed").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    durationMs: Date.now() - startedAt,
    results,
  };

  console.log("refresh complete", summary);

  // Partial success is normal (one competition may 429). Total failure is not,
  // and throwing lets EventBridge retry and eventually route to the DLQ.
  if (summary.refreshed === 0 && summary.failed > 0) {
    throw new Error(
      `refresh failed for all ${summary.failed} targets: ${
        results.find((r) => r.error)?.error ?? "unknown error"
      }`,
    );
  }

  return summary;
};
