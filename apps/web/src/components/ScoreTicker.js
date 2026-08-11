import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { isLive } from "@/lib/api";
import { useT } from "@/context/LanguageContext";
import { formatMatchTime, scoreline, teamMark } from "@/lib/format";
import { MOTION_OK } from "@/lib/motion";
/**
 * Broadcast-style score bar. The track is duplicated and translated -50% so the
 * loop is seamless; duration scales with content so ten matches do not race
 * past at the same speed as two.
 */
export function ScoreTicker({ matches }) {
    const t = useT();
    if (matches.length === 0)
        return null;
    const duration = Math.max(28, matches.length * 6);
    const track = [...matches, ...matches];
    return (_jsxs("div", { className: "relative overflow-hidden border-y border-ink-line bg-ink-raised/70", "aria-label": t("home.liveNow"), children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent" }), _jsx("div", { className: "pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent" }), _jsx("div", { className: `flex w-max ${MOTION_OK ? "animate-ticker" : "overflow-x-auto"}`, style: { ["--ticker-duration"]: `${duration}s` }, children: track.map((match, index) => (_jsx(TickerItem, { match: match, duplicate: index >= matches.length }, `${match.fixture.id}-${index}`))) })] }));
}
function TickerItem({ match, duplicate }) {
    const { home, away } = scoreline(match);
    const played = home !== null && away !== null;
    const live = isLive(match);
    return (_jsxs(Link, { to: `/match/${match.fixture.id}`, ...(duplicate ? { "aria-hidden": true, tabIndex: -1 } : {}), className: "group flex shrink-0 items-center gap-3 border-r border-ink-line px-5 py-3\n                 transition-colors duration-300 hover:bg-ink-raised", children: [live && _jsx("span", { className: "h-1.5 w-1.5 animate-live rounded-full bg-ember-bright" }), _jsx("span", { className: "u-display text-xs text-ink-muted transition-colors group-hover:text-ink-bright", children: teamMark(match.teams.home) }), _jsx("span", { className: "tnum u-display text-sm text-ink-bright", children: played ? `${home}–${away}` : formatMatchTime(match.fixture.date) }), _jsx("span", { className: "u-display text-xs text-ink-muted transition-colors group-hover:text-ink-bright", children: teamMark(match.teams.away) })] }));
}
