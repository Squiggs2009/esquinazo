import { useMemo, useState } from "react";
import { LeagueRail } from "@/components/LeagueRail";
import { MatchCard } from "@/components/MatchCard";
import { MatchCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { Chip } from "@/components/Badges";
import { useFixtures } from "@/lib/queries";
import { groupByDay, weekRange } from "@/lib/format";
import { DEFAULT_LEAGUE_ID, isLive, LEAGUES } from "@/lib/api";
import { useReveal } from "@/lib/motion";

export default function Fixtures() {
  useTitle("Fixtures");

  const [competition, setCompetition] = useState(DEFAULT_LEAGUE_ID);
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => weekRange(weekOffset), [weekOffset]);

  const { data, isPending, isError, error, refetch, isFetching } = useFixtures({
    league: competition,
    dateFrom: week.from,
    dateTo: week.to,
  });

  const matches = data?.data.fixtures ?? [];
  const liveCount = matches.filter(isLive).length;
  const league = LEAGUES.find((l) => l.id === competition);

  return (
    <>
      <PageHeader
        eyebrow="Matches"
        title="Fixtures"
        lede="One week at a time - scheduled and completed matches in the selected competition."
        aside={
          liveCount > 0 ? (
            <Chip tone="live">
              {liveCount} live {liveCount === 1 ? "match" : "matches"}
            </Chip>
          ) : undefined
        }
      />

      <div className="u-frame grid gap-10 pb-section lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <LeagueRail
          value={competition}
          onChange={(leagueId) => {
            setCompetition(leagueId);
            setWeekOffset(0);
          }}
        />

        <div className="min-w-0">
          {/* Keep the heading stable while a refetch is in flight. */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-ink-line pb-4">
            <h2 className="u-display text-sm text-ink-bright">{league?.name ?? competition}</h2>
            {isFetching && !isPending && (
              <span className="u-eyebrow text-ink-muted">Updating…</span>
            )}
          </div>

          <WeekNav label={week.label} onPrev={() => setWeekOffset((w) => w - 1)} onNext={() => setWeekOffset((w) => w + 1)} />

          {isPending ? (
            <SkeletonList count={8}>{() => <MatchCardSkeleton />}</SkeletonList>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : matches.length === 0 ? (
            <EmptyState
              headline="No matches this week"
              detail={`Nothing scheduled for ${league?.name ?? competition} during ${week.rangeText}. Try the next or previous week - mid-season breaks and international windows leave gaps like this.`}
            />
          ) : (
            <DayGroups key={`${competition}-${weekOffset}`} matches={matches} />
          )}
        </div>
      </div>
    </>
  );
}

function WeekNav({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-4 sm:justify-start">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous week"
        className="grid h-9 w-9 shrink-0 place-items-center border border-ink-line text-ink-muted
                   transition-colors duration-300 hover:border-ember hover:text-ember"
      >
        <ChevronIcon direction="left" />
      </button>
      <span className="u-eyebrow w-32 text-center text-ink-muted">{label}</span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next week"
        className="grid h-9 w-9 shrink-0 place-items-center border border-ink-line text-ink-muted
                   transition-colors duration-300 hover:border-ember hover:text-ember"
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DayGroups({ matches }: { matches: Parameters<typeof MatchCard>[0]["match"][] }) {
  const scope = useReveal<HTMLDivElement>({ y: 18, stagger: 0.04 });
  const days = groupByDay(matches);

  return (
    <div ref={scope} className="flex flex-col gap-12">
      {days.map(([day, dayMatches]) => (
        <section key={day}>
          <h3 className="js-reveal u-eyebrow sticky top-[var(--nav-h)] z-10 bg-ink/92 py-3 backdrop-blur-sm">
            {day}
          </h3>
          <div className="border-t border-ink-line">
            {dayMatches.map((match) => (
              <div key={match.fixture.id} className="js-reveal">
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
