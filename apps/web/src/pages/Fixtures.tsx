import { useMemo, useState } from "react";
import { LeagueRail } from "@/components/LeagueRail";
import { MatchCard } from "@/components/MatchCard";
import { MatchCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useT } from "@/context/LanguageContext";
import { Chip } from "@/components/Badges";
import { useFixtures } from "@/lib/queries";
import { groupByDay, weekRange } from "@/lib/format";
import { DEFAULT_LEAGUE_ID, isLive, LEAGUES } from "@/lib/api";
import { useReveal } from "@/lib/motion";

export default function Fixtures() {
  const t = useT();
  useTitle(t("fixtures.title"));

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
  const leagueName = league?.name ?? String(competition);

  const weekLabel =
    weekOffset === 0
      ? t("fixtures.thisWeek")
      : weekOffset === -1
        ? t("fixtures.lastWeek")
        : weekOffset === 1
          ? t("fixtures.nextWeek")
          : week.rangeText;

  return (
    <>
      <PageHeader
        eyebrow={t("fixtures.eyebrow")}
        title={t("fixtures.title")}
        lede={t("fixtures.lede")}
        aside={
          liveCount > 0 ? (
            <Chip tone="live">
              {liveCount === 1
                ? t("fixtures.liveOne", { count: liveCount })
                : t("fixtures.liveMany", { count: liveCount })}
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
            <h2 className="u-display text-sm text-ink-bright">{leagueName}</h2>
            {isFetching && !isPending && (
              <span className="u-eyebrow text-ink-muted">{t("fixtures.updating")}</span>
            )}
          </div>

          <WeekNav
            label={weekLabel}
            onPrev={() => setWeekOffset((w) => w - 1)}
            onNext={() => setWeekOffset((w) => w + 1)}
          />

          {isPending ? (
            <SkeletonList count={8}>{() => <MatchCardSkeleton />}</SkeletonList>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : matches.length === 0 ? (
            <EmptyState
              headline={t("fixtures.emptyTitle")}
              detail={t("fixtures.emptyDetail", { league: leagueName, range: week.rangeText })}
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
  const t = useT();

  return (
    <div className="mb-8 flex items-center justify-center gap-4 sm:justify-start">
      <button
        type="button"
        onClick={onPrev}
        aria-label={t("fixtures.prevWeekLabel")}
        className="grid h-9 w-9 shrink-0 place-items-center border border-ink-line text-ink-muted
                   transition-colors duration-300 hover:border-ember hover:text-ember"
      >
        <ChevronIcon direction="left" />
      </button>
      <span className="u-eyebrow w-32 text-center text-ink-muted">{label}</span>
      <button
        type="button"
        onClick={onNext}
        aria-label={t("fixtures.nextWeekLabel")}
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
          <h3 className="js-reveal u-eyebrow sticky top-[var(--nav-h)] z-10 bg-ink/[0.92] py-3 backdrop-blur-sm">
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
