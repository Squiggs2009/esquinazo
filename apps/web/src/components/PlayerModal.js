import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Chip, PlayerAvatar, TeamBadge } from "@/components/Badges";
import { Shimmer } from "@/components/Skeleton";
import { useT } from "@/context/LanguageContext";
import { isKnownPosition } from "@/lib/i18n";
import { statisticsForLeague } from "@/lib/api";
import { usePlayerStatistics } from "@/lib/queries";
export function PlayerModal({ player, team, leagueId, season, onClose }) {
    const t = useT();
    const open = player !== null;
    const [visible, setVisible] = useState(false);
    // Keeps the last player rendered through the close transition, so the
    // sheet doesn't go blank before it finishes sliding away.
    const [shown, setShown] = useState(null);
    const closeButtonRef = useRef(null);
    // Only fetch when the caller actually named a competition - leagueId alone
    // cannot select a season, and a season without a leagueId has nothing to
    // pick statisticsForLeague against.
    const statsSeason = leagueId !== undefined ? season : undefined;
    const statsQuery = usePlayerStatistics(shown?.player.id, statsSeason);
    const statsEntry = leagueId !== undefined && statsQuery.data
        ? statisticsForLeague(statsQuery.data.data.statistics, leagueId)
        : undefined;
    const statBars = statsEntry ? buildStatBars(statsEntry, t) : [];
    useEffect(() => {
        if (player)
            setShown({ player, team });
    }, [player, team]);
    useEffect(() => {
        if (!open) {
            setVisible(false);
            return;
        }
        // One frame so the off-screen starting position paints before the
        // transition to visible runs, instead of the two states colliding.
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, [open]);
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);
    useEffect(() => {
        if (!open)
            return;
        const onKeyDown = (event) => {
            if (event.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);
    useEffect(() => {
        if (open)
            closeButtonRef.current?.focus();
    }, [open]);
    if (!shown)
        return null;
    const posLabel = isKnownPosition(shown.player.position)
        ? t(`position.${shown.player.position}`)
        : shown.player.position;
    return (_jsxs(_Fragment, { children: [_jsx("div", { onClick: onClose, "aria-hidden": "true", className: `fixed inset-0 z-[60] bg-ink/80 backdrop-blur-sm transition-opacity duration-500
                    ease-out motion-reduce:transition-none
                    ${visible ? "opacity-100" : "pointer-events-none opacity-0"}` }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": shown.player.name, "aria-hidden": !open, className: `fixed inset-x-0 bottom-0 z-[61] flex max-h-[85vh] flex-col overflow-y-auto
                    border-t border-ink-line bg-ink transition-transform duration-500 ease-out
                    motion-reduce:transition-none
                    sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:h-full sm:max-h-none sm:w-full
                    sm:max-w-md sm:border-l sm:border-t-0
                    ${visible
                    ? "translate-y-0 sm:translate-x-0"
                    : "pointer-events-none translate-y-full sm:translate-x-full sm:translate-y-0"}`, children: [_jsx("span", { className: "mx-auto mt-2.5 block h-1 w-10 shrink-0 bg-ink-line sm:hidden", "aria-hidden": "true" }), _jsxs("div", { className: "flex shrink-0 items-center justify-between border-b border-ink-line px-5 py-4 sm:px-6", children: [_jsx("span", { className: "u-eyebrow text-ink-muted", children: t("player.modal.title") }), _jsx("button", { ref: closeButtonRef, type: "button", onClick: onClose, "aria-label": t("player.modal.close"), className: "grid h-8 w-8 shrink-0 place-items-center text-ink-muted transition-colors\n                       duration-300 hover:text-ink-bright", children: _jsx(CloseIcon, {}) })] }), _jsxs("div", { className: "flex flex-col items-center gap-4 border-b border-ink-line p-6 text-center sm:p-8", children: [_jsx(PlayerAvatar, { name: shown.player.name, playerId: shown.player.id, ...(shown.player.photo === undefined ? {} : { photo: shown.player.photo }), size: "xl" }), _jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "u-display text-title text-ink-bright", children: shown.player.name }), _jsxs("div", { className: "mt-2.5 flex flex-wrap items-center justify-center gap-2", children: [shown.player.position && _jsx(Chip, { tone: "ember", children: posLabel }), shown.player.number ? (_jsxs("span", { className: "tnum text-xs text-ink-muted", children: ["#", shown.player.number] })) : null, shown.player.age ? (_jsx("span", { className: "text-xs text-ink-muted", children: t("player.modal.age", { age: shown.player.age }) })) : null] })] })] }), shown.team && (_jsxs("div", { className: "flex shrink-0 items-center gap-3 border-b border-ink-line px-6 py-5 sm:px-8", children: [_jsx(TeamBadge, { team: shown.team, size: "md" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "u-eyebrow text-ink-muted", children: t("player.modal.team") }), _jsx("p", { className: "truncate text-sm font-semibold text-ink-bright", children: shown.team.name })] })] })), _jsxs("div", { className: "px-6 py-6 sm:px-8", children: [_jsx("h3", { className: "u-eyebrow mb-4 text-ink-muted", children: t("player.modal.statsTitle") }), statsQuery.isLoading ? (_jsx(StatBarsSkeleton, {})) : (_jsx(StatBars, { stats: statBars, emptyMessage: t("player.modal.statsEmpty") }))] })] })] }));
}
/**
 * Maps one competition's raw statistics onto bars. Ceilings are a workload
 * benchmark, not a record: 3,420 minutes / 38 appearances is a full
 * European-style season played start to finish, so a Liga MX Apertura
 * regular (a shorter competition) reads as a partially filled bar rather
 * than a maxed-out one - which is the honest picture partway through any
 * season, MX or otherwise.
 */
function buildStatBars(entry, t) {
    const goals = entry.goals?.total ?? 0;
    const assists = entry.goals?.assists ?? 0;
    const tackles = entry.tackles?.total ?? 0;
    const minutes = entry.games?.minutes ?? 0;
    const appearances = entry.games?.appearences ?? 0;
    const accuracyRaw = entry.passes?.accuracy;
    const accuracy = accuracyRaw === null || accuracyRaw === undefined
        ? 0
        : Number.parseFloat(String(accuracyRaw).replace("%", "")) || 0;
    return [
        { key: "goals", label: t("player.stat.goals"), display: String(goals), value: goals, max: 20 },
        {
            key: "assists",
            label: t("player.stat.assists"),
            display: String(assists),
            value: assists,
            max: 15,
        },
        {
            key: "passAccuracy",
            label: t("player.stat.passAccuracy"),
            display: `${Math.round(accuracy)}%`,
            value: accuracy,
            max: 100,
        },
        {
            key: "tackles",
            label: t("player.stat.tackles"),
            display: String(tackles),
            value: tackles,
            max: 100,
        },
        {
            key: "minutes",
            label: t("player.stat.minutes"),
            display: minutes.toLocaleString(),
            value: minutes,
            max: 3420,
        },
        {
            key: "appearances",
            label: t("player.stat.appearances"),
            display: String(appearances),
            value: appearances,
            max: 38,
        },
    ];
}
function StatBarsSkeleton() {
    return (_jsx("div", { className: "flex flex-col gap-4", "aria-hidden": "true", children: Array.from({ length: 6 }, (_, index) => (_jsxs("div", { children: [_jsxs("div", { className: "mb-1.5 flex items-baseline justify-between gap-3", children: [_jsx(Shimmer, { className: "h-3 w-24" }), _jsx(Shimmer, { className: "h-3 w-6" })] }), _jsx(Shimmer, { className: "h-1.5 w-full" })] }, index))) }));
}
function StatBars({ stats, emptyMessage }) {
    if (stats.length === 0) {
        return (_jsx("p", { className: "u-rule border border-dashed px-5 py-8 text-center text-sm text-ink-muted", children: emptyMessage }));
    }
    return (_jsx("div", { className: "flex flex-col gap-4", children: stats.map((stat) => {
            const pct = stat.max <= 0 ? 0 : Math.min(100, (stat.value / stat.max) * 100);
            return (_jsxs("div", { children: [_jsxs("div", { className: "mb-1.5 flex items-baseline justify-between gap-3 text-xs", children: [_jsx("span", { className: "text-ink-muted", children: stat.label }), _jsx("span", { className: "tnum font-semibold text-ink-bright", children: stat.display })] }), _jsx("div", { className: "h-1.5 overflow-hidden bg-ink", children: _jsx("span", { className: "block h-full bg-ember transition-[width] duration-700 ease-out", style: { width: `${pct}%` } }) })] }, stat.key));
        }) }));
}
function CloseIcon() {
    return (_jsx("svg", { viewBox: "0 0 16 16", className: "h-4 w-4", "aria-hidden": "true", children: _jsx("path", { d: "M2.5 2.5l11 11m0-11l-11 11", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" }) }));
}
