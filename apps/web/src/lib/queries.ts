import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  getFixtures,
  getNews,
  getSquad,
  getStandings,
  getTeams,
  getTransfers,
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

export function useTransfers(playerId: number | undefined) {
  return useQuery({
    queryKey: ["transfers", playerId],
    queryFn: () => getTransfers(playerId as number),
    enabled: typeof playerId === "number",
    staleTime: 60 * MINUTE,
    retry: retryPolicy,
  });
}

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: getNews,
    staleTime: 10 * MINUTE,
    retry: retryPolicy,
  });
}
