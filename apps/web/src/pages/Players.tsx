import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlayerAvatar, Chip, TeamBadge } from "@/components/Badges";
import { LeagueRail } from "@/components/LeagueRail";
import { PlayerCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useSquad, useTeams } from "@/lib/queries";
import { useReveal } from "@/lib/motion";
import { LEAGUES } from "@/lib/api";
import type { Player } from "@/lib/api";

/**
 * The API exposes players a squad at a time (GET /players?team=<id>), so this
 * page is "pick a league, then a club, then search within its squad" rather
 * than a global index. The club list comes from GET /teams?competition=,
 * backed by football-data.org's /competitions/{code}/teams - the same
 * LeagueRail used on Fixtures/Standings drives which competition is active.
 */
export default function Players() {
  useTitle("Players");

  const [params, setParams] = useSearchParams();
  const teamParam = Number(params.get("team"));
  const [search, setSearch] = useState("");
  const [competition, setCompetition] = useState("PL");

  const {
    data: teamsResponse,
    isPending: teamsPending,
    isError: teamsError,
    error: teamsErrorDetail,
    refetch: refetchTeams,
  } = useTeams(competition);
  const teams = useMemo(() => teamsResponse?.data.teams ?? [], [teamsResponse]);

  // Prefer a URL-supplied team (e.g. a Standings row link) as long as it
  // belongs to the currently selected league; otherwise fall back to that
  // league's first club. Derived directly from render inputs rather than an
  // effect that writes the fallback back into the URL - there is nothing to
  // reconcile, so nothing needs to run after the fact.
  const teamId = useMemo(() => {
    const fromUrl = Number.isFinite(teamParam) && teamParam > 0 ? teamParam : undefined;
    if (fromUrl !== undefined && teams.some((team) => team.id === fromUrl)) {
      return fromUrl;
    }
    return teams[0]?.id;
  }, [teamParam, teams]);

  const { data, isPending, isError, error, refetch } = useSquad(teamId);

  const squad = data?.data.squad ?? [];
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return squad;
    return squad.filter(
      (player) =>
        player.name.toLowerCase().includes(needle) ||
        (player.position ?? "").toLowerCase().includes(needle) ||
        (player.nationality ?? "").toLowerCase().includes(needle),
    );
  }, [squad, search]);

  const league = LEAGUES.find((l) => l.code === competition);

  return (
    <>
      <PageHeader
        eyebrow="Squads"
        title="Players"
        lede="Choose a league and a club, then filter by name, position or nationality."
      />

      <div className="u-frame grid gap-10 pb-section lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <LeagueRail
          value={competition}
          onChange={(code) => {
            setCompetition(code);
            // Let teamId re-derive to the new league's first club instead of
            // carrying the old league's id in the URL until it's overwritten.
            setParams({}, { replace: true });
          }}
        />

        <div className="min-w-0">
          <div className="mb-8 flex flex-col gap-4 border-b border-ink-line pb-6 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="u-eyebrow mb-2 block">{league?.name ?? competition} club</span>
              <select
                value={teamId ?? ""}
                onChange={(event) => setParams({ team: event.target.value })}
                disabled={teamsPending || teams.length === 0}
                className="w-full border border-ink-line bg-ink-raised px-4 py-3 text-sm text-ink-bright
                           transition-colors duration-300 hover:border-ink-muted focus:border-ember
                           disabled:opacity-50"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex-1">
              <span className="u-eyebrow mb-2 block">Search squad</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, position or nation"
                className="w-full border border-ink-line bg-ink-raised px-4 py-3 text-sm text-ink-bright
                           placeholder:text-ink-muted/70 transition-colors duration-300
                           hover:border-ink-muted focus:border-ember"
              />
            </label>
          </div>

          {teamsError ? (
            <ErrorState error={teamsErrorDetail} onRetry={() => void refetchTeams()} />
          ) : (
            <>
              {data?.data && (
                <div className="mb-8 flex items-center gap-4">
                  <TeamBadge team={data.data} size="lg" />
                  <div>
                    <h2 className="u-display text-title text-ink-bright">{data.data.name}</h2>
                    <p className="mt-1 text-xs text-ink-muted">
                      {data.data.venue ? `${data.data.venue} · ` : ""}
                      {squad.length} registered
                    </p>
                  </div>
                </div>
              )}

              {teamsPending || isPending ? (
                <div className="grid gap-px bg-ink-line sm:grid-cols-2 lg:grid-cols-3">
                  <SkeletonList count={9}>{() => <PlayerCardSkeleton />}</SkeletonList>
                </div>
              ) : isError ? (
                <ErrorState error={error} onRetry={() => void refetch()} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  headline={search ? "No one matches that" : "Squad unavailable"}
                  detail={
                    search
                      ? `Nothing in this squad matches “${search}”. Try a surname, or a position like "Midfield".`
                      : "The feed has no squad list for this club yet."
                  }
                  action={
                    search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="u-display border border-ember px-5 py-2 text-xs uppercase tracking-wider
                                   text-ember transition-colors duration-300 hover:bg-ember hover:text-ink"
                      >
                        Clear search
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <PlayerGrid key={teamId} players={filtered} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function PlayerGrid({ players }: { players: Player[] }) {
  const scope = useReveal<HTMLDivElement>({ y: 18, stagger: 0.03, duration: 0.7 });

  return (
    <div
      ref={scope}
      className="grid grid-cols-1 gap-px border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-3"
    >
      {players.map((player) => (
        <article
          key={player.id}
          className="js-reveal group bg-ink p-5 transition-colors duration-500 ease-out hover:bg-ink-raised"
        >
          <div className="flex items-center gap-3.5">
            <PlayerAvatar
              name={player.name}
              className="transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-ink-bright">{player.name}</h3>
              {player.nationality && (
                <p className="mt-0.5 truncate text-xs text-ink-muted">{player.nationality}</p>
              )}
            </div>
          </div>

          {player.position && (
            <div className="mt-5">
              <Chip tone="ember">{player.position}</Chip>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
