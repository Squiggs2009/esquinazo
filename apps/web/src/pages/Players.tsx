import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlayerAvatar, Chip, TeamBadge } from "@/components/Badges";
import { PlayerCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useSquad, useStandings } from "@/lib/queries";
import { useReveal } from "@/lib/motion";
import type { Player } from "@/lib/api";

/**
 * The API exposes players a squad at a time (GET /players?team=<id>), so this
 * page is "pick a club, then search within it" rather than a global index.
 * The club list is borrowed from the Premier League table, which is the only
 * cheap source of team ids the API already serves.
 */
export default function Players() {
  useTitle("Players");

  const [params, setParams] = useSearchParams();
  const teamParam = Number(params.get("team"));
  const [search, setSearch] = useState("");

  const { data: table, isPending: teamsPending } = useStandings("PL");
  const teams = useMemo(
    () => (table?.data.standings[0]?.table ?? []).map((row) => row.team),
    [table],
  );

  const teamId = Number.isFinite(teamParam) && teamParam > 0 ? teamParam : teams[0]?.id;
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

  return (
    <>
      <PageHeader
        eyebrow="Squads"
        title="Players"
        lede="Choose a club, then filter by name, position or nationality."
      />

      <div className="u-frame pb-section">
        <div className="mb-10 flex flex-col gap-4 border-b border-ink-line pb-6 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="u-eyebrow mb-2 block">Club</span>
            <select
              value={teamId ?? ""}
              onChange={(event) => setParams({ team: event.target.value })}
              disabled={teamsPending}
              className="w-full border border-ink-line bg-ink-raised px-4 py-3 text-sm text-ink-bright
                         transition-colors duration-300 hover:border-ink-muted focus:border-ember"
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

        {isPending ? (
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
          <PlayerGrid players={filtered} />
        )}
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
