import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LeagueRail } from "@/components/LeagueRail";
import { TeamBadge } from "@/components/Badges";
import { SkeletonList, TableRowSkeleton } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useT } from "@/context/LanguageContext";
import { useStandings } from "@/lib/queries";
import { formGuide } from "@/lib/format";
import { DEFAULT_LEAGUE_ID, LEAGUES } from "@/lib/api";
import { useReveal } from "@/lib/motion";
export default function Standings() {
    const t = useT();
    useTitle(t("standings.title"));
    const [competition, setCompetition] = useState(DEFAULT_LEAGUE_ID);
    const { data, isPending, isError, error, refetch } = useStandings(competition);
    // A league returns a single group; a cup returns one per group.
    const groups = data?.data.standings ?? [];
    const hasRows = groups.some((group) => group.length > 0);
    const league = LEAGUES.find((l) => l.id === competition);
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { eyebrow: t("standings.eyebrow"), title: t("standings.title"), lede: t("standings.lede") }), _jsxs("div", { className: "u-frame grid gap-10 pb-section lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14", children: [_jsx(LeagueRail, { value: competition, onChange: setCompetition }), _jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "u-display mb-6 border-b border-ink-line pb-4 text-sm text-ink-bright", children: league?.name ?? competition }), isPending ? (_jsx(SkeletonList, { count: 12, children: () => _jsx(TableRowSkeleton, {}) })) : isError ? (_jsx(ErrorState, { error: error, onRetry: () => void refetch() })) : !hasRows ? (_jsx(EmptyState, { headline: t("standings.emptyTitle"), detail: t("standings.emptyDetail") })) : (_jsx("div", { className: "flex flex-col gap-12", children: groups.map((rows, index) => (_jsx(Table, { rows: rows, ...(groups.length > 1 && rows[0]?.group
                                        ? { caption: rows[0].group }
                                        : {}) }, rows[0]?.group ?? index))) }, competition))] })] })] }));
}
function Table({ rows, caption }) {
    const scope = useReveal({ y: 14, stagger: 0.02, duration: 0.6 });
    const t = useT();
    return (_jsxs("div", { ref: scope, className: "overflow-x-auto", children: [caption && _jsx("h3", { className: "u-eyebrow mb-4 text-ember", children: caption }), _jsxs("table", { className: "w-full min-w-[38rem] border-collapse text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "u-eyebrow border-b border-ink-line text-left", children: [_jsx("th", { scope: "col", className: "w-10 py-3 pl-2 font-normal", children: "#" }), _jsx("th", { scope: "col", className: "py-3 font-normal", children: t("standings.club") }), _jsx("th", { scope: "col", className: "w-12 py-3 text-right font-normal", children: t("standings.played") }), _jsx("th", { scope: "col", className: "w-10 py-3 text-right font-normal", children: t("standings.won") }), _jsx("th", { scope: "col", className: "w-10 py-3 text-right font-normal", children: t("standings.drawn") }), _jsx("th", { scope: "col", className: "w-10 py-3 text-right font-normal", children: t("standings.lost") }), _jsx("th", { scope: "col", className: "w-14 py-3 text-right font-normal", children: t("standings.goalDiff") }), _jsx("th", { scope: "col", className: "w-14 py-3 text-right font-normal", children: t("standings.points") }), _jsx("th", { scope: "col", className: "hidden w-32 py-3 pl-6 font-normal sm:table-cell", children: t("standings.form") })] }) }), _jsx("tbody", { children: rows.map((row) => (_jsxs("tr", { className: "js-reveal group border-b border-ink-line transition-colors duration-300\n                         hover:bg-ink-raised", children: [_jsxs("td", { className: "relative py-3 pl-2", children: [_jsx("span", { className: `absolute inset-y-0 left-0 w-0.5 ${zoneColor(row.description)}` }), _jsx("span", { className: "tnum text-ink-muted", children: row.rank })] }), _jsx("td", { className: "py-3", children: _jsxs(Link, { to: `/players?team=${row.team.id}`, className: "flex items-center gap-3 transition-colors duration-300 hover:text-ember", children: [_jsx(TeamBadge, { team: row.team, size: "sm" }), _jsx("span", { className: "truncate font-semibold", children: row.team.name })] }) }), _jsx("td", { className: "tnum py-3 text-right text-ink-muted", children: row.all.played }), _jsx("td", { className: "tnum py-3 text-right text-ink-muted", children: row.all.win }), _jsx("td", { className: "tnum py-3 text-right text-ink-muted", children: row.all.draw }), _jsx("td", { className: "tnum py-3 text-right text-ink-muted", children: row.all.lose }), _jsx("td", { className: "tnum py-3 text-right text-ink-muted", children: row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff }), _jsx("td", { className: "tnum u-display py-3 text-right text-ink-bright", children: row.points }), _jsx("td", { className: "hidden py-3 pl-6 sm:table-cell", children: _jsx(FormDots, { form: row.form }) })] }, row.team.id))) })] }), _jsxs("p", { className: "mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-muted", children: [_jsx(Legend, { className: "bg-emerald-500", label: t("standings.zoneChampions") }), _jsx(Legend, { className: "bg-ember", label: t("standings.zoneEuropa") }), _jsx(Legend, { className: "bg-blood", label: t("standings.zoneRelegation") })] })] }));
}
/**
 * Zone colouring comes from the provider's own `description` rather than fixed
 * position numbers: across ten competitions the cut-offs differ (the
 * Championship promotes via play-off, Liga MX has a Liguilla, cups have none at
 * all), so hardcoding "top 4, bottom 3" would mislabel most of them.
 */
function zoneColor(description) {
    if (!description)
        return "bg-transparent";
    const text = description.toLowerCase();
    if (text.includes("relegation"))
        return "bg-blood";
    if (text.includes("champions league"))
        return "bg-emerald-500";
    if (text.includes("europa") || text.includes("conference") || text.includes("play-off")) {
        return "bg-ember";
    }
    if (text.includes("promotion"))
        return "bg-emerald-500";
    return "bg-transparent";
}
function Legend({ className, label }) {
    return (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2 w-2 rounded-full ${className}` }), label] }));
}
const RESULT_STYLES = {
    W: "bg-emerald-500/85 text-ink",
    D: "bg-ink-muted/40 text-ink-bright",
    L: "bg-blood text-ink-bright",
};
function FormDots({ form }) {
    const t = useT();
    const results = formGuide(form);
    if (results.length === 0) {
        return _jsx("span", { className: "text-xs text-ink-muted", children: "\u2014" });
    }
    return (_jsx("span", { className: "flex gap-1.5", "aria-label": t("standings.recentForm", { results: results.join(", ") }), children: results.map((result, index) => (_jsx("span", { "aria-hidden": "true", className: `grid h-5 w-5 place-items-center rounded-full text-[0.625rem] font-bold
                      ${RESULT_STYLES[result]}`, children: result }, index))) }));
}
