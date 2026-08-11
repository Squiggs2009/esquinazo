import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { TeamBadge } from "./Badges";
import { isLive, leagueCodeFor } from "@/lib/api";
import { useStatusLabel, useT } from "@/context/LanguageContext";
import { matchTimeParts, scoreline } from "@/lib/format";
/**
 * A fixture row rather than a boxed card: hairline separators, the scoreline
 * set in tabular figures on the right, and a live match marked by an ember bar
 * down its leading edge. Hover lifts the row and lights that edge.
 *
 * `showLeague` adds a competition code under the kick-off time. Off by default:
 * on Fixtures and Standings the league is already established by the rail, so
 * the label would just repeat it. The homepage mixes ten competitions in one
 * list and needs it.
 */
export function MatchCard({ match, showLeague = false }) {
    const t = useT();
    const statusLabel = useStatusLabel();
    const live = isLive(match);
    const { home, away } = scoreline(match);
    const played = home !== null && away !== null;
    const status = match.fixture.status.short;
    const finished = status === "FT" || status === "AET" || status === "PEN";
    const leagueCode = showLeague ? leagueCodeFor(match.league.id) : undefined;
    const { time, zone } = matchTimeParts(match.fixture.date);
    // Dim the losing side once a result stands - the eye should find the winner
    // without reading the numbers.
    const homeLost = finished && played && home < away;
    const awayLost = finished && played && away < home;
    return (_jsxs(Link, { to: `/match/${match.fixture.id}`, className: "group relative block border-b border-ink-line transition-all duration-500 ease-out\n                 hover:z-10 hover:-translate-y-0.5 hover:bg-ink-raised hover:shadow-ember\n                 focus-visible:z-10 focus-visible:bg-ink-raised", children: [_jsx("span", { className: `absolute inset-y-0 left-0 w-1 transition-all duration-500 ease-out
                    ${live ? "bg-ember shadow-[0_0_16px_2px_rgba(204,85,0,0.55)]" : "bg-ember/0 group-hover:bg-ember/60"}`, "aria-hidden": "true" }), _jsxs("div", { className: "flex items-center gap-4 py-4 pl-5 pr-4 sm:gap-6 sm:pl-7 sm:pr-6", children: [_jsxs("div", { className: "w-16 shrink-0 sm:w-20", children: [live ? (_jsxs("span", { className: "u-eyebrow flex items-center gap-1.5 text-ember-bright", children: [_jsx("span", { className: "h-1.5 w-1.5 animate-live rounded-full bg-ember-bright" }), match.fixture.status.elapsed
                                        ? `${match.fixture.status.elapsed}'`
                                        : t("match.live")] })) : finished ? (_jsx("span", { className: "block text-sm text-ink-muted", children: statusLabel(status) })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "tnum block text-xs text-ink-muted sm:text-sm", children: time }), zone && (_jsx("span", { className: "mt-0.5 block text-[0.625rem] leading-none text-ink-muted/70", children: zone }))] })), showLeague && leagueCode && (_jsxs("span", { className: "u-display mt-1.5 inline-block rounded-full border border-ink-line px-1.5\n                         py-0.5 text-[0.5625rem] leading-none text-ink-muted", children: [_jsx("span", { "aria-hidden": "true", children: leagueCode }), _jsx("span", { className: "sr-only", children: match.league.name })] }))] }), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-2.5", children: [_jsx(TeamLine, { team: match.teams.home, dimmed: homeLost }), _jsx(TeamLine, { team: match.teams.away, dimmed: awayLost })] }), _jsx("div", { className: "shrink-0 text-right", children: played ? (_jsxs("div", { className: "tnum u-display flex flex-col gap-2.5 text-xl leading-none sm:text-2xl", children: [_jsx("span", { className: homeLost ? "text-ink-muted" : "text-ink-bright", children: home }), _jsx("span", { className: awayLost ? "text-ink-muted" : "text-ink-bright", children: away })] })) : (_jsx("span", { className: "u-eyebrow text-ink-muted", children: statusLabel(status) })) })] })] }));
}
function TeamLine({ team, dimmed }) {
    return (_jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [_jsx(TeamBadge, { team: team, size: "sm", className: dimmed ? "opacity-45" : "" }), _jsx("span", { className: `truncate text-sm font-semibold sm:text-base ${dimmed ? "text-ink-muted" : "text-ink-bright"}`, children: team.name })] }));
}
