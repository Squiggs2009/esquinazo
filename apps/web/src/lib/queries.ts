import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  getFixtureDetail,
  getFixtures,
  getFixturesByDate,
  getPlayerStatistics,
  getSquad,
  getStandings,
  getTeams,
  getTransfers,
  isLive,
  type FixturesQuery,
} from "./api";

/**
 * Cache windows mirror the server-side TTLs (fixtures 60s, standings 300s,
 * squads 3600s) so the client does not re-ask for data the API would only
 * serve from its own cache anyway.
 */
const MINUTE = 60_000;

/** 4xx means the request itself was wrong - retrying cannot fix it. */
function retryPolicy(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function useFixtures(query: FixturesQuery = {}) {
  return useQuery({
    queryKey: ["fixtures", query],
    queryFn: () => getFixtures(query),
    staleTime: MINUTE,
    refetchInterval: MINUTE,
    retry: retryPolicy,
  });
}

/**
 * Today's matches across every configured league, for the homepage rundown.
 *
 * The date is the viewer's local calendar day, while the provider interprets
 * it as UTC - close enough for European and American kick-off times, and it
 * keeps one cache entry per day rather than one per timezone.
 */
export function useTodayFixtures() {
  const date = todayISODate();

  return useQuery({
    queryKey: ["fixtures-by-date", date],
    queryFn: () => getFixturesByDate(date),
    staleTime: MINUTE,
    refetchInterval: MINUTE,
    retry: retryPolicy,
  });
}

/**
 * Local calendar date, not toISOString().slice(0, 10) - that converts through
 * UTC first and shifts the day backward for anyone in a positive UTC offset
 * whenever local midnight falls before UTC midnight.
 */
function todayISODate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * A single match with events, lineups and statistics. Polls on the same minute
 * cadence as the fixture list while the match is actually in play, and stops
 * once it is not - a finished match's events never change again.
 */
export function useFixtureDetail(fixtureId: number | undefined) {
  return useQuery({
    queryKey: ["fixture-detail", fixtureId],
    queryFn: () => getFixtureDetail(fixtureId as number),
    enabled: typeof fixtureId === "number" && Number.isFinite(fixtureId),
    staleTime: MINUTE,
    refetchInterval: (query) => {
      const detail = query.state.data?.data.detail;
      return detail && isLive(detail) ? MINUTE : false;
    },
    retry: retryPolicy,
  });
}

export function useStandings(league: number) {
  return useQuery({
    queryKey: ["standings", league],
    queryFn: () => getStandings({ league }),
    staleTime: 5 * MINUTE,
    retry: retryPolicy,
  });
}

export function useTeams(league: number) {
  return useQuery({
    queryKey: ["teams", league],
    queryFn: () => getTeams(league),
    staleTime: 60 * MINUTE,
    retry: retryPolicy,
  });
}

export function useSquad(teamId: number | undefined) {
  return useQuery({
    queryKey: ["squad", teamId],
    queryFn: () => getSquad(teamId as number),
    enabled: typeof teamId === "number",
    staleTime: 60 * MINUTE,
    retry: retryPolicy,
  });
}

/**
 * Season statistics for one player. `season` is left to the caller rather
 * than defaulted here: unlike squads and standings, which resolve their own
 * current season server-side, this endpoint's season is competition-specific
 * (Liga MX's Apertura numbering does not match a European league's), so
 * there is no single "current" value this hook could assume.
 */
export function usePlayerStatistics(playerId: number | undefined, season: number | undefined) {
  return useQuery({
    queryKey: ["player-statistics", playerId, season],
    queryFn: () => getPlayerStatistics(playerId as number, season as number),
    enabled: typeof playerId === "number" && typeof season === "number",
    staleTime: 60 * MINUTE,
    retry: retryPolicy,
  });
}

export function useTransfers(playerId: number | undefined) {
  return useQuery({
    queryKey: ["transfers", playerId],
    queryFn: () => getTransfers(playerId as number),
    enabled: typeof playerId === "number",
    staleTime: 60 * MINUTE,
    retry: retryPolicy,
  });
}
