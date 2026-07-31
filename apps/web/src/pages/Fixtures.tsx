import { useState } from "react";
import { LeagueRail } from "@/components/LeagueRail";
import { MatchCard } from "@/components/MatchCard";
import { MatchCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { Chip } from "@/components/Badges";
import { useFixtures } from "@/lib/queries";
import { groupByDay } from "@/lib/format";
import { isLive, LEAGUES } from "@/lib/api";
import { useReveal } from "@/lib/motion";

export default function Fixtures() {
  useTitle("Fixtures");

  const [competition, setCompetition] = useState("PL");
  const { data, isPending, isError, error, refetch, isFetching } = useFixtures({ competition });

  const matches = data?.data.matches ?? [];
  const liveCount = matches.filter(isLive).length;
  const league = LEAGUES.find((l) => l.code === competition);

  return (
    <>
      <PageHeader
        eyebrow="Matches"
        title="Fixtures"
        lede="Every scheduled and completed match in the selected competition, newest day first."
        aside={
          liveCount > 0 ? (
            <Chip tone="live">
              {liveCount} live {liveCount === 1 ? "match" : "matches"}
            </Chip>
          ) : undefined
        }
      />

      <div className="u-frame grid gap-10 pb-section lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <LeagueRail value={competition} onChange={setCompetition} />

        <div className="min-w-0">
          {/* Keep the heading stable while a refetch is in flight. */}
          <div className="mb-6 flex items-center justify-between border-b border-ink-line pb-4">
            <h2 className="u-display text-sm text-ink-bright">{league?.name ?? competition}</h2>
            {isFetching && !isPending && (
              <span className="u-eyebrow text-ink-muted">Updating…</span>
            )}
          </div>

          {isPending ? (
            <SkeletonList count={8}>{() => <MatchCardSkeleton />}</SkeletonList>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : matches.length === 0 ? (
            <EmptyState
              headline="No matches listed"
              detail={`The feed has nothing scheduled for ${league?.name ?? competition} right now. Mid-season breaks and international windows leave gaps like this.`}
            />
          ) : (
            <DayGroups matches={matches} />
          )}
        </div>
      </div>
    </>
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
              <div key={match.id} className="js-reveal">
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
