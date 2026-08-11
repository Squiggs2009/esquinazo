import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
import { Chip, PlayerAvatar, TeamBadge } from "@/components/Badges";
import { PitchDiagram } from "@/components/PitchDiagram";
import { Shimmer } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { useTitle } from "@/components/PageShell";
import { useStatusLabel, useT } from "@/context/LanguageContext";
import { useFixtureDetail } from "@/lib/queries";
import { isLive } from "@/lib/api";
import { formatMatchTime, matchDay, scoreline } from "@/lib/format";
import { useReveal } from "@/lib/motion";
/**
 * Fetches the match by id rather than searching the fixture list, so a match
 * outside the current week's window still resolves.
 */
export default function MatchDetail() {
    const { id } = useParams();
    const matchId = Number(id);
    const t = useT();
    const { data, isPending, isError, error, refetch } = useFixtureDetail(Number.isFinite(matchId) && matchId > 0 ? matchId : undefined);
    const match = data?.data.detail ?? null;
    useTitle(match ? `${match.teams.home.name} vs ${match.teams.away.name}` : t("match.title"));
    if (isPending)
        return _jsx(MatchSkeleton, {});
    if (isError) {
        return (_jsx("div", { className: "u-frame pb-section pt-[calc(var(--nav-h)+4rem)]", children: _jsx(ErrorState, { error: error, onRetry: () => void refetch() }) }));
    }
    if (!match) {
        return (_jsx("div", { className: "u-frame pb-section pt-[calc(var(--nav-h)+4rem)]", children: _jsx(EmptyState, { headline: t("match.notFoundTitle"), detail: t("match.notFoundDetail"), action: _jsx(Link, { to: "/fixtures", className: "u-display border border-ember px-5 py-2 text-xs uppercase tracking-wider\n                         text-ember transition-colors duration-300 hover:bg-ember hover:text-ink", children: t("match.backButton") }) }) }));
    }
    return _jsx(MatchView, { match: match });
}
function MatchView({ match }) {
    const scope = useReveal({ y: 22 });
    const t = useT();
    const statusLabel = useStatusLabel();
    const { home, away } = scoreline(match);
    const played = home !== null && away !== null;
    const live = isLive(match);
    const status = match.fixture.status.short;
    const events = match.events ?? [];
    const lineups = match.lineups ?? [];
    const statistics = match.statistics ?? [];
    return (_jsxs("div", { ref: scope, children: [_jsxs("header", { className: "relative overflow-hidden border-b border-ink-line pt-[calc(var(--nav-h)+3rem)]", children: [_jsx("div", { className: "absolute inset-0 -z-10 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(204,85,0,0.16),transparent_65%)]", "aria-hidden": "true" }), _jsxs("div", { className: "u-frame pb-12", children: [_jsxs("div", { className: "js-reveal flex flex-wrap items-center gap-3", children: [_jsx(Link, { to: "/fixtures", className: "u-eyebrow text-ink-muted hover:text-ink-bright", children: t("match.backToFixtures") }), _jsx(Chip, { children: match.league.name }), live ? (_jsx(Chip, { tone: "live", children: match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : t("match.live") })) : (_jsx(Chip, { children: statusLabel(status) }))] }), _jsxs("div", { className: "js-reveal mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-10", children: [_jsx(Side, { team: match.teams.home, align: "right" }), _jsxs("div", { className: "text-center", children: [played ? (_jsxs("p", { className: "tnum u-display text-score text-ink-bright", children: [home, " ", _jsx("span", { className: "text-ink-muted", children: "\u2013" }), " ", away] })) : (_jsx("p", { className: "tnum u-display text-title text-ink-bright", children: formatMatchTime(match.fixture.date) })), _jsx("p", { className: "u-eyebrow mt-3", children: matchDay(match.fixture.date) })] }), _jsx(Side, { team: match.teams.away, align: "left" })] })] })] }), _jsx(PitchDiagram, { lineups: lineups, events: events, homeTeamId: match.teams.home.id }), _jsxs("div", { className: "u-frame grid gap-12 pb-section pt-12 lg:grid-cols-[minmax(0,1fr)_20rem]", children: [_jsxs("div", { className: "flex min-w-0 flex-col gap-14", children: [_jsx(Timeline, { events: events, homeTeamId: match.teams.home.id, halftimeScore: match.score?.halftime }), _jsx(Statistics, { statistics: statistics }), _jsx(Lineups, { lineups: lineups })] }), _jsxs("aside", { className: "js-reveal", children: [_jsx("h2", { className: "u-eyebrow mb-5", children: t("match.facts") }), _jsxs("dl", { className: "flex flex-col", children: [_jsx(Fact, { label: t("match.competition"), value: match.league.name }), _jsx(Fact, { label: t("match.round"), value: match.league.round ?? "—" }), _jsx(Fact, { label: t("match.venue"), value: match.fixture.venue?.name ?? "—" }), _jsx(Fact, { label: t("match.kickoff"), value: `${matchDay(match.fixture.date)} · ${formatMatchTime(match.fixture.date)}` }), _jsx(Fact, { label: t("match.status"), value: statusLabel(status) }), match.score?.halftime?.home !== null && match.score?.halftime !== undefined && (_jsx(Fact, { label: t("match.halfTime"), value: `${match.score.halftime.home ?? 0} – ${match.score.halftime.away ?? 0}` }))] })] })] })] }));
}
function Side({ team, align }) {
    return (_jsxs("div", { className: `flex min-w-0 items-center gap-3 sm:gap-4 ${align === "right" ? "flex-row-reverse text-right" : "text-left"}`, children: [_jsx(TeamBadge, { team: team, size: "lg", className: "hidden sm:grid" }), _jsx(TeamBadge, { team: team, size: "md", className: "sm:hidden" }), _jsx("div", { className: "min-w-0", children: _jsx("h2", { className: "u-display truncate text-sm leading-tight text-ink-bright sm:text-xl", children: team.name }) })] }));
}
/* ---------------------------- Timeline ---------------------------- */
/**
 * Maps an event onto a dictionary key. Goals and cards carry their specific
 * kind in `detail` ("Own Goal", "Yellow Card"), so that is preferred over the
 * coarse `type`.
 */
function eventLabelKey(event) {
    const detail = (event.detail ?? "").toLowerCase();
    if (event.type === "Card") {
        return detail.includes("red") ? "event.redCard" : "event.yellowCard";
    }
    if (event.type === "subst")
        return "event.substitution";
    if (event.type === "Var")
        return "event.var";
    if (detail.includes("own goal"))
        return "event.ownGoal";
    if (detail.includes("missed"))
        return "event.missedPenalty";
    if (detail.includes("penalty"))
        return "event.penalty";
    return "event.Goal";
}
function EventMarker({ event }) {
    const detail = (event.detail ?? "").toLowerCase();
    if (event.type === "Card") {
        const red = detail.includes("red");
        return (_jsx("span", { "aria-hidden": "true", className: `block h-3.5 w-2.5 shrink-0 rounded-[1px] ${red ? "bg-blood" : "bg-yellow-400"}` }));
    }
    if (event.type === "subst") {
        return (_jsx("svg", { viewBox: "0 0 16 16", className: "h-3.5 w-3.5 shrink-0 text-emerald-400", "aria-hidden": "true", children: _jsx("path", { d: "M4 5h7l-2-2m3 6H5l2 2", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) }));
    }
    // Goal (and VAR, which usually resolves one) - a target ring, the loudest
    // marker in the set because it is the only one that changes the score. A
    // missed penalty gets the ring without the filled centre.
    const missed = detail.includes("missed");
    return (_jsxs("svg", { viewBox: "0 0 16 16", className: "h-3.5 w-3.5 shrink-0", "aria-hidden": "true", children: [_jsx("circle", { cx: "8", cy: "8", r: "6", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: missed ? "text-ink-muted" : "text-ember" }), !missed && _jsx("circle", { cx: "8", cy: "8", r: "2.25", className: "fill-ember" })] }));
}
/**
 * Running scoreline at the moment of each goal. `event.team` already names
 * the side the goal counts for even for own goals - verified against a real
 * fixture (Toluca 3-1 Necaxa, Liga MX): the own-goal scorer played for
 * Necaxa, but the event's `team` named Toluca, the side it benefited. So the
 * same team-id check every other event on this page uses is enough; no
 * separate own-goal attribution is needed.
 */
function withRunningScore(ordered, homeTeamId) {
    let home = 0;
    let away = 0;
    return ordered.map((event) => {
        const detail = (event.detail ?? "").toLowerCase();
        if (event.type !== "Goal" || detail.includes("missed")) {
            return { event };
        }
        if (event.team.id === homeTeamId)
            home += 1;
        else
            away += 1;
        return { event, score: [home, away] };
    });
}
function Timeline({ events, homeTeamId, halftimeScore, }) {
    const t = useT();
    const ordered = [...events].sort((a, b) => (a.time.elapsed ?? 0) - (b.time.elapsed ?? 0) || (a.time.extra ?? 0) - (b.time.extra ?? 0));
    const withScores = withRunningScore(ordered, homeTeamId);
    // Second-half events start at 46' - only worth a divider if the list
    // actually has events on both sides of it.
    const halftimeIndex = withScores.findIndex((item) => (item.event.time.elapsed ?? 0) >= 46);
    const showHalftime = halftimeScore?.home !== null && halftimeScore?.home !== undefined && halftimeIndex > 0;
    return (_jsxs("section", { className: "js-reveal", children: [_jsx("h2", { className: "u-eyebrow mb-6", children: t("match.timeline") }), ordered.length === 0 ? (_jsx("p", { className: "u-rule border border-dashed px-5 py-10 text-center text-sm text-ink-muted", children: t("match.timelineEmpty") })) : (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink-line", "aria-hidden": "true" }), _jsx("ol", { className: "relative z-10 flex flex-col", children: withScores.map((item, index) => (_jsxs("li", { children: [showHalftime && index === halftimeIndex && _jsx(HalftimeDivider, { score: halftimeScore }), _jsx(TimelineRow, { item: item, homeTeamId: homeTeamId })] }, `${item.event.time.elapsed}-${item.event.player?.id ?? index}-${index}`))) })] }))] }));
}
function HalftimeDivider({ score }) {
    const t = useT();
    return (_jsxs("div", { className: "flex items-center gap-4 bg-ink py-3", children: [_jsx("span", { className: "h-px flex-1 bg-ink-line", "aria-hidden": "true" }), _jsxs("span", { className: "u-eyebrow tnum shrink-0 text-ink-muted", children: [t("match.halfTime"), " \u00B7 ", score?.home ?? 0, "\u2013", score?.away ?? 0] }), _jsx("span", { className: "h-px flex-1 bg-ink-line", "aria-hidden": "true" })] }));
}
function TimelineRow({ item, homeTeamId, }) {
    const t = useT();
    const { event, score } = item;
    const home = event.team.id === homeTeamId;
    const isSub = event.type === "subst";
    // For substitutions the provider puts the player coming OFF in `player`
    // and the one coming ON in `assist` - verified against the starting XI.
    const leadName = (isSub ? event.assist?.name : event.player?.name) ?? "—";
    const leadId = (isSub ? event.assist?.id : event.player?.id) ?? undefined;
    const minute = `${event.time.elapsed ?? 0}${event.time.extra ? `+${event.time.extra}` : ""}'`;
    const avatar = _jsx(PlayerAvatar, { name: leadName, playerId: leadId, size: "sm", className: "shrink-0" });
    const textBlock = (_jsxs("div", { className: `min-w-0 ${home ? "text-right" : "text-left"}`, children: [_jsxs("p", { className: `truncate text-sm font-semibold ${isSub ? "text-emerald-400" : "text-ink-bright"}`, children: [leadName, score && (_jsxs("span", { className: "tnum ml-1.5 font-normal text-ember-bright", children: ["(", score[0], "-", score[1], ")"] }))] }), isSub ? (event.player?.name && (_jsxs("p", { className: "truncate text-xs text-ink-muted", children: [t("event.subOut"), ": ", event.player.name] }))) : (event.assist?.name && (_jsx("p", { className: "truncate text-xs text-ink-muted", children: t("event.assist", { name: event.assist.name }) })))] }));
    // Home hugs the centre line from the left (avatar outermost); away hugs it
    // from the right (avatar outermost on the other side) - not a mirrored
    // flex-reverse of the same markup, since which element is "outermost"
    // flips with the side.
    const content = (_jsx("div", { className: `flex min-w-0 items-center gap-3 ${home ? "justify-end" : "justify-start"}`, children: home ? (_jsxs(_Fragment, { children: [avatar, textBlock] })) : (_jsxs(_Fragment, { children: [textBlock, avatar] })) }));
    return (_jsxs("div", { className: "grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2.5 sm:gap-4", children: [_jsx("div", { className: "min-w-0", children: home ? content : null }), _jsxs("div", { className: "flex items-center gap-1.5 bg-ink px-0.5", children: [_jsx(EventMarker, { event: event }), _jsx("span", { className: "tnum text-xs text-ink-muted", children: minute }), _jsx("span", { className: "sr-only", children: t(eventLabelKey(event)) })] }), _jsx("div", { className: "min-w-0", children: !home ? content : null })] }));
}
/* --------------------------- Statistics --------------------------- */
/** Upstream stat names, in the order they should read, mapped to dictionary keys. */
const STAT_ROWS = [
    { upstream: "Ball Possession", key: "stat.possession" },
    { upstream: "Total Shots", key: "stat.shots" },
    { upstream: "Shots on Goal", key: "stat.onTarget" },
    { upstream: "Corner Kicks", key: "stat.corners" },
    { upstream: "Fouls", key: "stat.fouls" },
    { upstream: "Offsides", key: "stat.offsides" },
    { upstream: "Goalkeeper Saves", key: "stat.saves" },
];
/** "55%" and 12 both become numbers; null and "-" become 0. */
function statNumber(value) {
    if (typeof value === "number")
        return value;
    if (typeof value !== "string")
        return 0;
    const parsed = Number.parseFloat(value.replace("%", ""));
    return Number.isFinite(parsed) ? parsed : 0;
}
function statDisplay(value) {
    if (value === null || value === undefined)
        return "0";
    return String(value);
}
function Statistics({ statistics }) {
    const t = useT();
    const [homeStats, awayStats] = statistics;
    if (!homeStats || !awayStats) {
        return (_jsxs("section", { className: "js-reveal", children: [_jsx("h2", { className: "u-eyebrow mb-6", children: t("match.stats") }), _jsx("p", { className: "u-rule border border-dashed px-5 py-10 text-center text-sm text-ink-muted", children: t("match.statsEmpty") })] }));
    }
    const find = (side, name) => side.statistics.find((s) => s.type === name)?.value ?? null;
    // Only rows the provider actually returned for this match.
    const rows = STAT_ROWS.map((row) => ({
        ...row,
        homeValue: find(homeStats, row.upstream),
        awayValue: find(awayStats, row.upstream),
    })).filter((row) => row.homeValue !== null || row.awayValue !== null);
    if (rows.length === 0) {
        return (_jsxs("section", { className: "js-reveal", children: [_jsx("h2", { className: "u-eyebrow mb-6", children: t("match.stats") }), _jsx("p", { className: "u-rule border border-dashed px-5 py-10 text-center text-sm text-ink-muted", children: t("match.statsEmpty") })] }));
    }
    return (_jsxs("section", { className: "js-reveal", children: [_jsx("h2", { className: "u-eyebrow mb-6", children: t("match.stats") }), _jsx("div", { className: "flex flex-col gap-6", children: rows.map((row) => {
                    const homeNum = statNumber(row.homeValue);
                    const awayNum = statNumber(row.awayValue);
                    const total = homeNum + awayNum;
                    const homeShare = total === 0 ? 50 : (homeNum / total) * 100;
                    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-2 flex items-baseline justify-between gap-3 text-sm", children: [_jsx("span", { className: "tnum u-display text-ink-bright", children: statDisplay(row.homeValue) }), _jsx("span", { className: "u-eyebrow text-center", children: t(row.key) }), _jsx("span", { className: "tnum u-display text-ink-bright", children: statDisplay(row.awayValue) })] }), _jsxs("div", { className: "flex h-1.5 overflow-hidden bg-ink-raised", children: [_jsx("span", { className: "bg-ember transition-[width] duration-700 ease-out", style: { width: `${homeShare}%` } }), _jsx("span", { className: "flex-1 bg-blood" })] })] }, row.upstream));
                }) })] }));
}
/* ----------------------------- Lineups ---------------------------- */
/**
 * Groups the starting XI by the row of the formation grid ("row:column"), so
 * 4-3-3 renders as four bands. Falls back to a flat list when the provider
 * omits grid positions, which happens for some competitions.
 */
function formationRows(lineup) {
    const rows = new Map();
    for (const entry of lineup.startXI) {
        const row = Number.parseInt((entry.player.grid ?? "").split(":")[0] ?? "", 10);
        if (!Number.isFinite(row))
            return null;
        const bucket = rows.get(row);
        if (bucket)
            bucket.push(entry);
        else
            rows.set(row, [entry]);
    }
    if (rows.size === 0)
        return null;
    return [...rows.entries()].sort(([a], [b]) => a - b).map(([, entries]) => entries);
}
function Lineups({ lineups }) {
    const t = useT();
    if (lineups.length === 0) {
        return (_jsxs("section", { className: "js-reveal", children: [_jsx("h2", { className: "u-eyebrow mb-6", children: t("match.lineups") }), _jsx("p", { className: "u-rule border border-dashed px-5 py-10 text-center text-sm text-ink-muted", children: t("match.lineupsEmpty") })] }));
    }
    return (_jsxs("section", { className: "js-reveal", children: [_jsx("h2", { className: "u-eyebrow mb-6", children: t("match.lineups") }), _jsx("div", { className: "grid gap-10 lg:grid-cols-2", children: lineups.map((lineup) => (_jsx(TeamLineup, { lineup: lineup }, lineup.team.id))) })] }));
}
function TeamLineup({ lineup }) {
    const t = useT();
    const rows = formationRows(lineup);
    return (_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "mb-5 flex items-center gap-3", children: [_jsx(TeamBadge, { team: lineup.team, size: "sm" }), _jsx("h3", { className: "u-display min-w-0 flex-1 truncate text-sm text-ink-bright", children: lineup.team.name }), lineup.formation && (_jsx("span", { className: "tnum u-eyebrow shrink-0 text-ember", children: lineup.formation }))] }), _jsx("p", { className: "u-eyebrow mb-3 text-[0.625rem]", children: t("match.startingXI") }), _jsx("div", { className: "flex flex-col-reverse gap-2 border border-ink-line bg-pitch/20 p-3", children: rows
                    ? rows.map((band, index) => (_jsx("div", { className: "flex flex-wrap justify-center gap-1.5", children: band.map((entry) => (_jsx(PitchPlayer, { entry: entry }, entry.player.id))) }, index)))
                    : lineup.startXI.map((entry) => _jsx(PitchPlayer, { entry: entry }, entry.player.id)) }), lineup.substitutes.length > 0 && (_jsxs(_Fragment, { children: [_jsx("p", { className: "u-eyebrow mb-3 mt-6 text-[0.625rem]", children: t("match.substitutes") }), _jsx("ul", { className: "flex flex-col gap-1.5", children: lineup.substitutes.map((entry) => (_jsxs("li", { className: "flex items-baseline gap-2.5 text-sm", children: [_jsx("span", { className: "tnum w-6 shrink-0 text-right text-xs text-ink-muted", children: entry.player.number ?? "—" }), _jsx("span", { className: "min-w-0 truncate text-ink-bright", children: entry.player.name })] }, entry.player.id))) })] })), lineup.coach?.name && (_jsxs("p", { className: "mt-5 border-t border-ink-line pt-4 text-xs text-ink-muted", children: [t("match.coach"), ": ", _jsx("span", { className: "text-ink-bright", children: lineup.coach.name })] }))] }));
}
function PitchPlayer({ entry }) {
    return (_jsxs("span", { className: "flex min-w-0 max-w-[8.5rem] items-baseline gap-1.5 border border-ink-line\n                 bg-ink px-2 py-1.5 text-xs", title: entry.player.name, children: [_jsx("span", { className: "tnum shrink-0 text-ember-bright", children: entry.player.number ?? "—" }), _jsx("span", { className: "min-w-0 truncate text-ink-bright", children: entry.player.name })] }));
}
/* ------------------------------ Shared ---------------------------- */
function Fact({ label, value }) {
    return (_jsxs("div", { className: "flex items-baseline justify-between gap-4 border-b border-ink-line py-3", children: [_jsx("dt", { className: "text-xs text-ink-muted", children: label }), _jsx("dd", { className: "text-right text-sm text-ink-bright", children: value })] }));
}
function MatchSkeleton() {
    return (_jsxs("div", { className: "u-frame pb-section pt-[calc(var(--nav-h)+3rem)]", role: "status", "aria-busy": "true", children: [_jsx(Shimmer, { className: "h-3 w-28" }), _jsxs("div", { className: "mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-6", children: [_jsxs("div", { className: "flex flex-row-reverse items-center gap-4", children: [_jsx(Shimmer, { className: "h-16 w-16 rounded-full" }), _jsx(Shimmer, { className: "h-5 w-28" })] }), _jsx(Shimmer, { className: "h-11 w-24" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Shimmer, { className: "h-16 w-16 rounded-full" }), _jsx(Shimmer, { className: "h-5 w-28" })] })] }), _jsxs("div", { className: "mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]", children: [_jsx(Shimmer, { className: "h-52 w-full" }), _jsx(Shimmer, { className: "h-52 w-full" })] })] }));
}
