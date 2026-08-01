import { Link, useParams } from "react-router-dom";
import { Chip, TeamBadge } from "@/components/Badges";
import { Shimmer } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { useTitle } from "@/components/PageShell";
import { useFixtures } from "@/lib/queries";
import { isLive, type Fixture, type Team } from "@/lib/api";
import { kickoffTime, matchDay, scoreline, statusLabel } from "@/lib/format";
import { useReveal } from "@/lib/motion";

/**
 * The match is located within the fixtures feed already in the query cache -
 * instant when arriving from a fixture list, a single fetch otherwise.
 */
export default function MatchDetail() {
  const { id } = useParams();
  const matchId = Number(id);

  const { data, isPending, isError, error, refetch } = useFixtures();
  const match = data?.data.fixtures.find((m) => m.fixture.id === matchId);

  useTitle(match ? `${match.teams.home.name} vs ${match.teams.away.name}` : "Match");

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
          headline="Match not found"
          detail="This fixture is not in the current feed window. Completed matches drop out of the list once the round moves on."
          action={
            <Link
              to="/fixtures"
              className="u-display border border-ember px-5 py-2 text-xs uppercase tracking-wider
                         text-ember transition-colors duration-300 hover:bg-ember hover:text-ink"
            >
              Back to fixtures
            </Link>
          }
        />
      </div>
    );
  }

  return <MatchView match={match} />;
}

function MatchView({ match }: { match: Fixture }) {
  const scope = useReveal<HTMLDivElement>({ y: 22 });
  const { home, away } = scoreline(match);
  const played = home !== null && away !== null;
  const live = isLive(match);
  const status = match.fixture.status.short;

  return (
    <div ref={scope}>
      {/* Scoreboard */}
      <header className="relative overflow-hidden border-b border-ink-line pt-[calc(var(--nav-h)+3rem)]">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(204,85,0,0.16),transparent_65%)]"
          aria-hidden="true"
        />

        <div className="u-frame pb-12">
          <div className="js-reveal flex flex-wrap items-center gap-3">
            <Link to="/fixtures" className="u-eyebrow text-ink-muted hover:text-ink-bright">
              ← Fixtures
            </Link>
            <Chip>{match.league.name}</Chip>
            {live ? (
              <Chip tone="live">
                {match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : "Live"}
              </Chip>
            ) : (
              <Chip>{statusLabel(status)}</Chip>
            )}
          </div>

          <div className="js-reveal mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-10">
            <Side team={match.teams.home} align="right" />

            <div className="text-center">
              {played ? (
                <p className="tnum u-display text-score text-ink-bright">
                  {home} <span className="text-ink-muted">–</span> {away}
                </p>
              ) : (
                <p className="tnum u-display text-title text-ink-bright">
                  {kickoffTime(match.fixture.date)}
                </p>
              )}
              <p className="u-eyebrow mt-3">{matchDay(match.fixture.date)}</p>
            </div>

            <Side team={match.teams.away} align="left" />
          </div>
        </div>
      </header>

      <div className="u-frame grid gap-12 pb-section pt-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-12">
          <Timeline match={match} />
          <Comparison match={match} />
        </div>

        <aside className="js-reveal">
          <h2 className="u-eyebrow mb-5">Match facts</h2>
          <dl className="flex flex-col">
            <Fact label="Competition" value={match.league.name} />
            <Fact label="Round" value={match.league.round ?? "—"} />
            <Fact label="Venue" value={match.fixture.venue?.name ?? "—"} />
            <Fact
              label="Kick-off"
              value={`${matchDay(match.fixture.date)} · ${kickoffTime(match.fixture.date)}`}
            />
            <Fact label="Status" value={statusLabel(status)} />
            {match.score?.halftime?.home !== null && match.score?.halftime !== undefined && (
              <Fact
                label="Half-time"
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
      className={`flex items-center gap-4 ${align === "right" ? "flex-row-reverse text-right" : "text-left"}`}
    >
      <TeamBadge team={team} size="lg" className="hidden sm:grid" />
      <TeamBadge team={team} size="md" className="sm:hidden" />
      <div className="min-w-0">
        <h2 className="u-display truncate text-base leading-tight text-ink-bright sm:text-xl">
          {team.name}
        </h2>
      </div>
    </div>
  );
}

/**
 * Score progression. Minute-level events (goals, cards, subs) come from
 * /fixtures/events, which this page does not call yet.
 */
function Timeline({ match }: { match: Fixture }) {
  const half = match.score?.halftime;
  const full = match.score?.fulltime;
  const hasProgress = half?.home !== null && half?.home !== undefined;
  const status = match.fixture.status.short;
  const finished = status === "FT" || status === "AET" || status === "PEN";

  return (
    <section className="js-reveal">
      <h2 className="u-eyebrow mb-6">Progression</h2>

      {!hasProgress ? (
        <p className="u-rule border border-dashed px-5 py-10 text-center text-sm text-ink-muted">
          Not yet under way. Score progression appears once the first half is complete.
        </p>
      ) : (
        <ol className="relative flex flex-col gap-7 border-l border-ink-line pl-7">
          <Moment label="Half-time" home={half?.home ?? 0} away={half?.away ?? 0} />
          {finished && (
            <Moment label="Full-time" home={full?.home ?? 0} away={full?.away ?? 0} emphasis />
          )}
        </ol>
      )}
    </section>
  );
}

function Moment({
  label,
  home,
  away,
  emphasis = false,
}: {
  label: string;
  home: number;
  away: number;
  emphasis?: boolean;
}) {
  return (
    <li className="relative">
      <span
        className={`absolute -left-[2.05rem] top-1.5 h-2.5 w-2.5 rounded-full
                    ${emphasis ? "bg-ember" : "bg-ink-line ring-1 ring-ink-muted/40"}`}
        aria-hidden="true"
      />
      <p className="u-eyebrow">{label}</p>
      <p className={`tnum u-display mt-1.5 text-lg ${emphasis ? "text-ember" : "text-ink-bright"}`}>
        {home} – {away}
      </p>
    </li>
  );
}

function Comparison({ match }: { match: Fixture }) {
  const { home, away } = scoreline(match);
  if (home === null || away === null) return null;

  const half = match.score?.halftime;
  const rows = [
    { label: "Goals", home, away },
    { label: "First half", home: half?.home ?? 0, away: half?.away ?? 0 },
    { label: "Second half", home: home - (half?.home ?? 0), away: away - (half?.away ?? 0) },
  ];

  return (
    <section className="js-reveal">
      <h2 className="u-eyebrow mb-6">Comparison</h2>
      <div className="flex flex-col gap-6">
        {rows.map((row) => {
          const total = row.home + row.away;
          const homeShare = total === 0 ? 50 : (row.home / total) * 100;

          return (
            <div key={row.label}>
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="tnum u-display text-ink-bright">{row.home}</span>
                <span className="u-eyebrow">{row.label}</span>
                <span className="tnum u-display text-ink-bright">{row.away}</span>
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
