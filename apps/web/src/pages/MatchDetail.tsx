import { Link, useParams } from "react-router-dom";
import { Chip, TeamBadge } from "@/components/Badges";
import { PitchDiagram } from "@/components/PitchDiagram";
import { Shimmer } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { useTitle } from "@/components/PageShell";
import { useStatusLabel, useT } from "@/context/LanguageContext";
import { useFixtureDetail } from "@/lib/queries";
import { isLive } from "@/lib/api";
import type { FixtureDetail, Lineup, MatchEvent, Team, TeamStatistics } from "@/lib/api";
import { formatMatchTime, matchDay, scoreline } from "@/lib/format";
import { useReveal } from "@/lib/motion";
import type { TranslationKey } from "@/lib/i18n";

/**
 * Fetches the match by id rather than searching the fixture list, so a match
 * outside the current week's window still resolves.
 */
export default function MatchDetail() {
  const { id } = useParams();
  const matchId = Number(id);
  const t = useT();

  const { data, isPending, isError, error, refetch } = useFixtureDetail(
    Number.isFinite(matchId) && matchId > 0 ? matchId : undefined,
  );
  const match = data?.data.detail ?? null;

  useTitle(match ? `${match.teams.home.name} vs ${match.teams.away.name}` : t("match.title"));

  if (isPending) return <MatchSkeleton />;
  if (isError) {
    return (
      <div className="u-frame pb-section pt-[calc(var(--nav-h)+4rem)]">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="u-frame pb-section pt-[calc(var(--nav-h)+4rem)]">
        <EmptyState
          headline={t("match.notFoundTitle")}
          detail={t("match.notFoundDetail")}
          action={
            <Link
              to="/fixtures"
              className="u-display border border-ember px-5 py-2 text-xs uppercase tracking-wider
                         text-ember transition-colors duration-300 hover:bg-ember hover:text-ink"
            >
              {t("match.backButton")}
            </Link>
          }
        />
      </div>
    );
  }

  return <MatchView match={match} />;
}

function MatchView({ match }: { match: FixtureDetail }) {
  const scope = useReveal<HTMLDivElement>({ y: 22 });
  const t = useT();
  const statusLabel = useStatusLabel();
  const { home, away } = scoreline(match);
  const played = home !== null && away !== null;
  const live = isLive(match);
  const status = match.fixture.status.short;

  const events = match.events ?? [];
  const lineups = match.lineups ?? [];
  const statistics = match.statistics ?? [];

  return (
    <div ref={scope}>
      <header className="relative overflow-hidden border-b border-ink-line pt-[calc(var(--nav-h)+3rem)]">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(204,85,0,0.16),transparent_65%)]"
          aria-hidden="true"
        />

        <div className="u-frame pb-12">
          <div className="js-reveal flex flex-wrap items-center gap-3">
            <Link to="/fixtures" className="u-eyebrow text-ink-muted hover:text-ink-bright">
              {t("match.backToFixtures")}
            </Link>
            <Chip>{match.league.name}</Chip>
            {live ? (
              <Chip tone="live">
                {match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : t("match.live")}
              </Chip>
            ) : (
              <Chip>{statusLabel(status)}</Chip>
            )}
          </div>

          <div className="js-reveal mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-10">
            <Side team={match.teams.home} align="right" />

            <div className="text-center">
              {played ? (
                <p className="tnum u-display text-score text-ink-bright">
                  {home} <span className="text-ink-muted">–</span> {away}
                </p>
              ) : (
                <p className="tnum u-display text-title text-ink-bright">
                  {formatMatchTime(match.fixture.date)}
                </p>
              )}
              <p className="u-eyebrow mt-3">{matchDay(match.fixture.date)}</p>
            </div>

            <Side team={match.teams.away} align="left" />
          </div>
        </div>
      </header>

      <PitchDiagram lineups={lineups} events={events} homeTeamId={match.teams.home.id} />

      <div className="u-frame grid gap-12 pb-section pt-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-14">
          <Timeline events={events} homeTeamId={match.teams.home.id} />
          <Statistics statistics={statistics} />
          <Lineups lineups={lineups} />
        </div>

        <aside className="js-reveal">
          <h2 className="u-eyebrow mb-5">{t("match.facts")}</h2>
          <dl className="flex flex-col">
            <Fact label={t("match.competition")} value={match.league.name} />
            <Fact label={t("match.round")} value={match.league.round ?? "—"} />
            <Fact label={t("match.venue")} value={match.fixture.venue?.name ?? "—"} />
            <Fact
              label={t("match.kickoff")}
              value={`${matchDay(match.fixture.date)} · ${formatMatchTime(match.fixture.date)}`}
            />
            <Fact label={t("match.status")} value={statusLabel(status)} />
            {match.score?.halftime?.home !== null && match.score?.halftime !== undefined && (
              <Fact
                label={t("match.halfTime")}
                value={`${match.score.halftime.home ?? 0} – ${match.score.halftime.away ?? 0}`}
              />
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Side({ team, align }: { team: Team; align: "left" | "right" }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 sm:gap-4 ${
        align === "right" ? "flex-row-reverse text-right" : "text-left"
      }`}
    >
      <TeamBadge team={team} size="lg" className="hidden sm:grid" />
      <TeamBadge team={team} size="md" className="sm:hidden" />
      <div className="min-w-0">
        <h2 className="u-display truncate text-sm leading-tight text-ink-bright sm:text-xl">
          {team.name}
        </h2>
      </div>
    </div>
  );
}

/* ---------------------------- Timeline ---------------------------- */

/**
 * Maps an event onto a dictionary key. Goals and cards carry their specific
 * kind in `detail` ("Own Goal", "Yellow Card"), so that is preferred over the
 * coarse `type`.
 */
function eventLabelKey(event: MatchEvent): TranslationKey {
  const detail = (event.detail ?? "").toLowerCase();

  if (event.type === "Card") {
    return detail.includes("red") ? "event.redCard" : "event.yellowCard";
  }
  if (event.type === "subst") return "event.substitution";
  if (event.type === "Var") return "event.var";

  if (detail.includes("own goal")) return "event.ownGoal";
  if (detail.includes("missed")) return "event.missedPenalty";
  if (detail.includes("penalty")) return "event.penalty";
  return "event.Goal";
}

function EventMarker({ event }: { event: MatchEvent }) {
  const detail = (event.detail ?? "").toLowerCase();

  if (event.type === "Card") {
    const red = detail.includes("red");
    return (
      <span
        aria-hidden="true"
        className={`block h-3.5 w-2.5 rounded-[1px] ${red ? "bg-blood" : "bg-yellow-400"}`}
      />
    );
  }

  if (event.type === "subst") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true">
        <path
          d="M4 5h7l-2-2m3 6H5l2 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Goal (and VAR, which usually resolves one) - a filled disc, the loudest
  // marker in the set because it is the only one that changes the score.
  const missed = detail.includes("missed");
  return (
    <span
      aria-hidden="true"
      className={`block h-3 w-3 rounded-full ${missed ? "bg-ink-muted" : "bg-ember"}`}
    />
  );
}

function Timeline({ events, homeTeamId }: { events: MatchEvent[]; homeTeamId: number }) {
  const t = useT();

  const ordered = [...events].sort(
    (a, b) => (a.time.elapsed ?? 0) - (b.time.elapsed ?? 0) || (a.time.extra ?? 0) - (b.time.extra ?? 0),
  );

  return (
    <section className="js-reveal">
      <h2 className="u-eyebrow mb-6">{t("match.timeline")}</h2>

      {ordered.length === 0 ? (
        <p className="u-rule border border-dashed px-5 py-10 text-center text-sm text-ink-muted">
          {t("match.timelineEmpty")}
        </p>
      ) : (
        <ol className="relative flex flex-col gap-5 border-l border-ink-line pl-6 sm:pl-7">
          {ordered.map((event, index) => {
            const home = event.team.id === homeTeamId;
            const isSub = event.type === "subst";

            return (
              <li key={`${event.time.elapsed}-${event.player?.id ?? index}-${index}`} className="relative">
                <span
                  className="absolute -left-[1.9rem] top-1 grid h-4 w-4 place-items-center sm:-left-[2.15rem]"
                >
                  <EventMarker event={event} />
                </span>

                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="tnum u-display text-sm text-ember-bright">
                    {event.time.elapsed ?? 0}
                    {event.time.extra ? `+${event.time.extra}` : ""}&apos;
                  </span>
                  <span className="u-eyebrow text-[0.625rem] text-ink-muted">
                    {t(eventLabelKey(event))}
                  </span>
                  {/* Which side it belongs to, without a second timeline column. */}
                  <span className="u-eyebrow text-[0.625rem] text-ink-muted/70">
                    {home ? "H" : "A"}
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-ink-bright">
                  {/* For substitutions the provider puts the player coming OFF
                      in `player` and the one coming ON in `assist` - verified
                      against the starting XI, not assumed from the field names. */}
                  {isSub ? (event.assist?.name ?? "—") : (event.player?.name ?? "—")}
                </p>

                {isSub ? (
                  event.player?.name && (
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {t("event.subOut")}: {event.player.name}
                    </p>
                  )
                ) : (
                  event.assist?.name && (
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {t("event.assist", { name: event.assist.name })}
                    </p>
                  )
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/* --------------------------- Statistics --------------------------- */

/** Upstream stat names, in the order they should read, mapped to dictionary keys. */
const STAT_ROWS: Array<{ upstream: string; key: TranslationKey }> = [
  { upstream: "Ball Possession", key: "stat.possession" },
  { upstream: "Total Shots", key: "stat.shots" },
  { upstream: "Shots on Goal", key: "stat.onTarget" },
  { upstream: "Corner Kicks", key: "stat.corners" },
  { upstream: "Fouls", key: "stat.fouls" },
  { upstream: "Offsides", key: "stat.offsides" },
  { upstream: "Goalkeeper Saves", key: "stat.saves" },
];

/** "55%" and 12 both become numbers; null and "-" become 0. */
function statNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function statDisplay(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return String(value);
}

function Statistics({ statistics }: { statistics: TeamStatistics[] }) {
  const t = useT();
  const [homeStats, awayStats] = statistics;

  if (!homeStats || !awayStats) {
    return (
      <section className="js-reveal">
        <h2 className="u-eyebrow mb-6">{t("match.stats")}</h2>
        <p className="u-rule border border-dashed px-5 py-10 text-center text-sm text-ink-muted">
          {t("match.statsEmpty")}
        </p>
      </section>
    );
  }

  const find = (side: TeamStatistics, name: string) =>
    side.statistics.find((s) => s.type === name)?.value ?? null;

  // Only rows the provider actually returned for this match.
  const rows = STAT_ROWS.map((row) => ({
    ...row,
    homeValue: find(homeStats, row.upstream),
    awayValue: find(awayStats, row.upstream),
  })).filter((row) => row.homeValue !== null || row.awayValue !== null);

  if (rows.length === 0) {
    return (
      <section className="js-reveal">
        <h2 className="u-eyebrow mb-6">{t("match.stats")}</h2>
        <p className="u-rule border border-dashed px-5 py-10 text-center text-sm text-ink-muted">
          {t("match.statsEmpty")}
        </p>
      </section>
    );
  }

  return (
    <section className="js-reveal">
      <h2 className="u-eyebrow mb-6">{t("match.stats")}</h2>

      <div className="flex flex-col gap-6">
        {rows.map((row) => {
          const homeNum = statNumber(row.homeValue);
          const awayNum = statNumber(row.awayValue);
          const total = homeNum + awayNum;
          const homeShare = total === 0 ? 50 : (homeNum / total) * 100;

          return (
            <div key={row.upstream}>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                <span className="tnum u-display text-ink-bright">{statDisplay(row.homeValue)}</span>
                <span className="u-eyebrow text-center">{t(row.key)}</span>
                <span className="tnum u-display text-ink-bright">{statDisplay(row.awayValue)}</span>
              </div>
              <div className="flex h-1.5 overflow-hidden bg-ink-raised">
                <span
                  className="bg-ember transition-[width] duration-700 ease-out"
                  style={{ width: `${homeShare}%` }}
                />
                <span className="flex-1 bg-blood" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------- Lineups ---------------------------- */

/**
 * Groups the starting XI by the row of the formation grid ("row:column"), so
 * 4-3-3 renders as four bands. Falls back to a flat list when the provider
 * omits grid positions, which happens for some competitions.
 */
function formationRows(lineup: Lineup) {
  const rows = new Map<number, Lineup["startXI"]>();

  for (const entry of lineup.startXI) {
    const row = Number.parseInt((entry.player.grid ?? "").split(":")[0] ?? "", 10);
    if (!Number.isFinite(row)) return null;
    const bucket = rows.get(row);
    if (bucket) bucket.push(entry);
    else rows.set(row, [entry]);
  }

  if (rows.size === 0) return null;
  return [...rows.entries()].sort(([a], [b]) => a - b).map(([, entries]) => entries);
}

function Lineups({ lineups }: { lineups: Lineup[] }) {
  const t = useT();

  if (lineups.length === 0) {
    return (
      <section className="js-reveal">
        <h2 className="u-eyebrow mb-6">{t("match.lineups")}</h2>
        <p className="u-rule border border-dashed px-5 py-10 text-center text-sm text-ink-muted">
          {t("match.lineupsEmpty")}
        </p>
      </section>
    );
  }

  return (
    <section className="js-reveal">
      <h2 className="u-eyebrow mb-6">{t("match.lineups")}</h2>
      <div className="grid gap-10 lg:grid-cols-2">
        {lineups.map((lineup) => (
          <TeamLineup key={lineup.team.id} lineup={lineup} />
        ))}
      </div>
    </section>
  );
}

function TeamLineup({ lineup }: { lineup: Lineup }) {
  const t = useT();
  const rows = formationRows(lineup);

  return (
    <div className="min-w-0">
      <div className="mb-5 flex items-center gap-3">
        <TeamBadge team={lineup.team} size="sm" />
        <h3 className="u-display min-w-0 flex-1 truncate text-sm text-ink-bright">
          {lineup.team.name}
        </h3>
        {lineup.formation && (
          <span className="tnum u-eyebrow shrink-0 text-ember">{lineup.formation}</span>
        )}
      </div>

      <p className="u-eyebrow mb-3 text-[0.625rem]">{t("match.startingXI")}</p>

      {/* Pitch bands: goalkeeper at the bottom, attack at the top, mirroring
          how a formation is written. */}
      <div className="flex flex-col-reverse gap-2 border border-ink-line bg-pitch/20 p-3">
        {rows
          ? rows.map((band, index) => (
              <div key={index} className="flex flex-wrap justify-center gap-1.5">
                {band.map((entry) => (
                  <PitchPlayer key={entry.player.id} entry={entry} />
                ))}
              </div>
            ))
          : lineup.startXI.map((entry) => <PitchPlayer key={entry.player.id} entry={entry} />)}
      </div>

      {lineup.substitutes.length > 0 && (
        <>
          <p className="u-eyebrow mb-3 mt-6 text-[0.625rem]">{t("match.substitutes")}</p>
          <ul className="flex flex-col gap-1.5">
            {lineup.substitutes.map((entry) => (
              <li key={entry.player.id} className="flex items-baseline gap-2.5 text-sm">
                <span className="tnum w-6 shrink-0 text-right text-xs text-ink-muted">
                  {entry.player.number ?? "—"}
                </span>
                <span className="min-w-0 truncate text-ink-bright">{entry.player.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {lineup.coach?.name && (
        <p className="mt-5 border-t border-ink-line pt-4 text-xs text-ink-muted">
          {t("match.coach")}: <span className="text-ink-bright">{lineup.coach.name}</span>
        </p>
      )}
    </div>
  );
}

function PitchPlayer({ entry }: { entry: Lineup["startXI"][number] }) {
  return (
    <span
      className="flex min-w-0 max-w-[8.5rem] items-baseline gap-1.5 border border-ink-line
                 bg-ink px-2 py-1.5 text-xs"
      title={entry.player.name}
    >
      <span className="tnum shrink-0 text-ember-bright">{entry.player.number ?? "—"}</span>
      <span className="min-w-0 truncate text-ink-bright">{entry.player.name}</span>
    </span>
  );
}

/* ------------------------------ Shared ---------------------------- */

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-line py-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-right text-sm text-ink-bright">{value}</dd>
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div className="u-frame pb-section pt-[calc(var(--nav-h)+3rem)]" role="status" aria-busy="true">
      <Shimmer className="h-3 w-28" />
      <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div className="flex flex-row-reverse items-center gap-4">
          <Shimmer className="h-16 w-16 rounded-full" />
          <Shimmer className="h-5 w-28" />
        </div>
        <Shimmer className="h-11 w-24" />
        <div className="flex items-center gap-4">
          <Shimmer className="h-16 w-16 rounded-full" />
          <Shimmer className="h-5 w-28" />
        </div>
      </div>
      <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Shimmer className="h-52 w-full" />
        <Shimmer className="h-52 w-full" />
      </div>
    </div>
  );
}
