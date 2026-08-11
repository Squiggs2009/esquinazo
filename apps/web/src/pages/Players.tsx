import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlayerAvatar, Chip, TeamBadge } from "@/components/Badges";
import { LeagueRail } from "@/components/LeagueRail";
import { PlayerModal } from "@/components/PlayerModal";
import { PositionLegend } from "@/components/PositionLegend";
import { PlayerCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useT } from "@/context/LanguageContext";
import { useSquad, useTeams } from "@/lib/queries";
import { useReveal } from "@/lib/motion";
import { DEFAULT_LEAGUE_ID, LEAGUES } from "@/lib/api";
import { isKnownPosition, POSITION_ORDER } from "@/lib/i18n";
import type { SquadPlayer } from "@/lib/api";
import type { PositionCategory, TranslationKey } from "@/lib/i18n";

/**
 * API-Football's season numbering is competition-specific rather than a
 * shared calendar year - Liga MX's Apertura runs under a different year than
 * a European league's current season would. The player stat modal only
 * covers Liga MX so far (see PlayerModal's leagueId/season props), so this is
 * the one competition this page can pass a season for.
 */
const LIGA_MX_LEAGUE_ID = 262;
const LIGA_MX_SEASON = 2026;

/**
 * The API exposes players a squad at a time (GET /players?team=<id>), so this
 * page is "pick a league, then a club, then search within its squad" rather
 * than a global index. The club list comes from GET /teams?league=, backed by
 * API-Football's /teams - the same LeagueRail used on Fixtures/Standings
 * drives which competition is active.
 */
export default function Players() {
  const t = useT();
  useTitle(t("players.title"));

  const [params, setParams] = useSearchParams();
  const teamParam = Number(params.get("team"));
  const playerParam = Number(params.get("player"));
  const leagueParam = Number(params.get("league"));
  const [search, setSearch] = useState("");
  // Seeded from the URL once, on mount: a Wire entry's deep link names the
  // team's actual competition (e.g. Liga MX), which may not be the site's
  // default (Premier League). Without this, ?team= would be checked against
  // the wrong league's roster and silently never match. Only the initial URL
  // value is honoured - later league switches go through the rail's onChange.
  const [competition, setCompetition] = useState(() =>
    LEAGUES.some((l) => l.id === leagueParam) ? leagueParam : DEFAULT_LEAGUE_ID,
  );
  const [selectedPlayer, setSelectedPlayer] = useState<SquadPlayer | null>(null);
  // Guards the deep-link auto-open to a single attempt, so closing the modal
  // (or a background squad refetch) never reopens it on its own.
  const autoOpenedPlayerRef = useRef(false);

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
    if (fromUrl !== undefined && teams.some((entry) => entry.team.id === fromUrl)) {
      return fromUrl;
    }
    return teams[0]?.team.id;
  }, [teamParam, teams]);

  const { data, isPending, isError, error, refetch } = useSquad(teamId);

  const squad = data?.data.players ?? [];
  const team = data?.data.team ?? null;

  // Opens the stat modal for a Wire-linked player once their squad has
  // actually loaded - matches what clicking their card would do, just
  // triggered by the URL instead of a click. Waiting for teamId === teamParam
  // (rather than just teamId) confirms the league resolved to the URL's team
  // rather than a same-league fallback club that happens to be selected
  // while data is still settling.
  useEffect(() => {
    if (autoOpenedPlayerRef.current) return;
    if (!Number.isFinite(playerParam) || playerParam <= 0) return;
    if (teamId !== teamParam) return;
    if (isPending || !data) return;

    autoOpenedPlayerRef.current = true;
    const match = data.data.players.find((player) => player.id === playerParam);
    if (match) setSelectedPlayer(match);
  }, [playerParam, teamParam, teamId, isPending, data]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return squad;
    return squad.filter(
      (player) =>
        player.name.toLowerCase().includes(needle) ||
        (player.position ?? "").toLowerCase().includes(needle) ||
        String(player.number ?? "").includes(needle),
    );
  }, [squad, search]);

  const league = LEAGUES.find((l) => l.id === competition);
  const leagueName = league?.name ?? String(competition);

  return (
    <>
      <PageHeader
        eyebrow={t("players.eyebrow")}
        title={t("players.title")}
        lede={t("players.lede")}
      />

      <div className="u-frame grid gap-10 pb-section lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <LeagueRail
          value={competition}
          onChange={(leagueId) => {
            setCompetition(leagueId);
            // Let teamId re-derive to the new league's first club instead of
            // carrying the old league's id in the URL until it's overwritten.
            setParams({}, { replace: true });
          }}
        />

        <div className="min-w-0">
          <div className="mb-8 flex flex-col gap-4 border-b border-ink-line pb-6 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="u-eyebrow mb-2 block">
                {t("players.club", { league: leagueName })}
              </span>
              <select
                value={teamId ?? ""}
                onChange={(event) => setParams({ team: event.target.value })}
                disabled={teamsPending || teams.length === 0}
                className="w-full border border-ink-line bg-ink-raised px-4 py-3 text-sm text-ink-bright
                           transition-colors duration-300 hover:border-ink-muted focus:border-ember
                           disabled:opacity-50"
              >
                {teams.map((entry) => (
                  <option key={entry.team.id} value={entry.team.id}>
                    {entry.team.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex-1">
              <span className="u-eyebrow mb-2 block">{t("players.search")}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("players.searchPlaceholder")}
                className="w-full border border-ink-line bg-ink-raised px-4 py-3 text-sm text-ink-bright
                           placeholder:text-ink-muted/70 transition-colors duration-300
                           hover:border-ink-muted focus:border-ember"
              />
            </label>
          </div>

          <PositionLegend />

          {teamsError ? (
            <ErrorState error={teamsErrorDetail} onRetry={() => void refetchTeams()} />
          ) : (
            <>
              {team && (
                <div className="mb-8 flex items-center gap-4">
                  <TeamBadge team={team} size="lg" />
                  <div className="min-w-0">
                    <h2 className="u-display truncate text-title text-ink-bright">{team.name}</h2>
                    <p className="mt-1 text-xs text-ink-muted">
                      {t("players.registered", { count: squad.length })}
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
                  headline={search ? t("players.noMatchTitle") : t("players.unavailableTitle")}
                  detail={
                    search
                      ? t("players.noMatchDetail", { search })
                      : t("players.unavailableDetail")
                  }
                  action={
                    search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="u-display border border-ember px-5 py-2 text-xs uppercase tracking-wider
                                   text-ember transition-colors duration-300 hover:bg-ember hover:text-ink"
                      >
                        {t("players.clearSearch")}
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <GroupedSquad
                  key={`${teamId}-${search}`}
                  players={filtered}
                  onSelect={setSelectedPlayer}
                />
              )}
            </>
          )}
        </div>
      </div>

      <PlayerModal
        player={selectedPlayer}
        team={team}
        onClose={() => setSelectedPlayer(null)}
        {...(competition === LIGA_MX_LEAGUE_ID
          ? { leagueId: LIGA_MX_LEAGUE_ID, season: LIGA_MX_SEASON }
          : {})}
      />
    </>
  );
}

/**
 * Groups a squad into the four categories the provider reports, in playing
 * order rather than alphabetically. Anything with an unrecognised position
 * falls into a trailing "other" bucket instead of being dropped.
 */
function groupByPosition(players: SquadPlayer[]) {
  const buckets = new Map<PositionCategory, SquadPlayer[]>();
  const other: SquadPlayer[] = [];

  for (const player of players) {
    if (isKnownPosition(player.position)) {
      const bucket = buckets.get(player.position);
      if (bucket) bucket.push(player);
      else buckets.set(player.position, [player]);
    } else {
      other.push(player);
    }
  }

  const groups = POSITION_ORDER.filter((p) => buckets.has(p)).map(
    (position) => [position, buckets.get(position) ?? []] as const,
  );

  return { groups, other };
}

function GroupedSquad({
  players,
  onSelect,
}: {
  players: SquadPlayer[];
  onSelect: (player: SquadPlayer) => void;
}) {
  const scope = useReveal<HTMLDivElement>({ y: 18, stagger: 0.03, duration: 0.7 });
  const t = useT();
  const { groups, other } = groupByPosition(players);

  return (
    <div ref={scope} className="flex flex-col gap-10">
      {groups.map(([position, group]) => (
        <section key={position}>
          <h3 className="js-reveal u-eyebrow mb-4 flex items-center gap-2 text-ember">
            <span className="h-2 w-2 shrink-0 bg-ember" aria-hidden="true" />
            {t(`position.group${position}` as TranslationKey)}
            <span className="tnum ml-1 text-ink-muted">{group.length}</span>
          </h3>
          <PlayerGrid players={group} onSelect={onSelect} />
        </section>
      ))}

      {other.length > 0 && <PlayerGrid players={other} onSelect={onSelect} />}
    </div>
  );
}

function PlayerGrid({
  players,
  onSelect,
}: {
  players: SquadPlayer[];
  onSelect: (player: SquadPlayer) => void;
}) {
  const t = useT();

  return (
    <div className="grid grid-cols-1 gap-px border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-3">
      {players.map((player) => (
        <article key={player.id} className="js-reveal">
          <button
            type="button"
            onClick={() => onSelect(player)}
            className="group block w-full bg-ink p-5 text-left transition-colors duration-500
                       ease-out hover:bg-ink-raised"
          >
            <div className="flex items-center gap-3.5">
              <PlayerAvatar
                name={player.name}
                playerId={player.id}
                {...(player.photo === undefined ? {} : { photo: player.photo })}
                className="transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="min-w-0">
                <h4 className="truncate font-semibold text-ink-bright">{player.name}</h4>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {player.number ? `#${player.number}` : "—"}
                  {player.age ? ` · ${player.age}` : ""}
                </p>
              </div>
            </div>

            {player.position && (
              <div className="mt-5">
                <Chip tone="ember">
                  {isKnownPosition(player.position)
                    ? t(`position.${player.position}` as TranslationKey)
                    : player.position}
                </Chip>
              </div>
            )}
          </button>
        </article>
      ))}
    </div>
  );
}
