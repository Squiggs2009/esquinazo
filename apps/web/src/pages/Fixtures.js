import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const weekLabel = weekOffset === 0
        ? t("fixtures.thisWeek")
        : weekOffset === -1
            ? t("fixtures.lastWeek")
            : weekOffset === 1
                ? t("fixtures.nextWeek")
                : week.rangeText;
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { eyebrow: t("fixtures.eyebrow"), title: t("fixtures.title"), lede: t("fixtures.lede"), aside: liveCount > 0 ? (_jsx(Chip, { tone: "live", children: liveCount === 1
                        ? t("fixtures.liveOne", { count: liveCount })
                        : t("fixtures.liveMany", { count: liveCount }) })) : undefined }), _jsxs("div", { className: "u-frame grid gap-10 pb-section lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14", children: [_jsx(LeagueRail, { value: competition, onChange: (leagueId) => {
                            setCompetition(leagueId);
                            setWeekOffset(0);
                        } }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-ink-line pb-4", children: [_jsx("h2", { className: "u-display text-sm text-ink-bright", children: leagueName }), isFetching && !isPending && (_jsx("span", { className: "u-eyebrow text-ink-muted", children: t("fixtures.updating") }))] }), _jsx(WeekNav, { label: weekLabel, onPrev: () => setWeekOffset((w) => w - 1), onNext: () => setWeekOffset((w) => w + 1) }), isPending ? (_jsx(SkeletonList, { count: 8, children: () => _jsx(MatchCardSkeleton, {}) })) : isError ? (_jsx(ErrorState, { error: error, onRetry: () => void refetch() })) : matches.length === 0 ? (_jsx(EmptyState, { headline: t("fixtures.emptyTitle"), detail: t("fixtures.emptyDetail", { league: leagueName, range: week.rangeText }) })) : (_jsx(DayGroups, { matches: matches }, `${competition}-${weekOffset}`))] })] })] }));
}
function WeekNav({ label, onPrev, onNext }) {
    const t = useT();
    return (_jsxs("div", { className: "mb-8 flex items-center justify-center gap-4 sm:justify-start", children: [_jsx("button", { type: "button", onClick: onPrev, "aria-label": t("fixtures.prevWeekLabel"), className: "grid h-9 w-9 shrink-0 place-items-center border border-ink-line text-ink-muted\n                   transition-colors duration-300 hover:border-ember hover:text-ember", children: _jsx(ChevronIcon, { direction: "left" }) }), _jsx("span", { className: "u-eyebrow w-32 text-center text-ink-muted", children: label }), _jsx("button", { type: "button", onClick: onNext, "aria-label": t("fixtures.nextWeekLabel"), className: "grid h-9 w-9 shrink-0 place-items-center border border-ink-line text-ink-muted\n                   transition-colors duration-300 hover:border-ember hover:text-ember", children: _jsx(ChevronIcon, { direction: "right" }) })] }));
}
function ChevronIcon({ direction }) {
    return (_jsx("svg", { viewBox: "0 0 16 16", className: "h-3.5 w-3.5", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: _jsx("path", { d: direction === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
function DayGroups({ matches }) {
    const scope = useReveal({ y: 18, stagger: 0.04 });
    const days = groupByDay(matches);
    return (_jsx("div", { ref: scope, className: "flex flex-col gap-12", children: days.map(([day, dayMatches]) => (_jsxs("section", { children: [_jsx("h3", { className: "js-reveal u-eyebrow sticky top-[var(--nav-h)] z-10 bg-ink/[0.92] py-3 backdrop-blur-sm", children: day }), _jsx("div", { className: "border-t border-ink-line", children: dayMatches.map((match) => (_jsx("div", { className: "js-reveal", children: _jsx(MatchCard, { match: match }) }, match.fixture.id))) })] }, day))) }));
}
