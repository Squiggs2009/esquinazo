import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlayerAvatar, TeamBadge } from "@/components/Badges";
import { PlayerCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { PlayerModal } from "@/components/PlayerModal";
import { useT } from "@/context/LanguageContext";
import { useSquad, useStandings, useTeams } from "@/lib/queries";
import { MOTION_OK, useReveal } from "@/lib/motion";
import { isKnownPosition } from "@/lib/i18n";
/** API-Football's competition id for the World Cup. */
const WORLD_CUP_LEAGUE_ID = 1;
/** The season the player stat modal requests stats under - see PlayerModal. */
const WORLD_CUP_SEASON = 2026;
/**
 * The 2026 World Cup field. Teams come from the tournament's own competition
 * id, and group letters from its standings - the teams endpoint alone does not
 * say which group a nation is in.
 */
export default function Nations() {
    const t = useT();
    useTitle(t("nations.title"));
    const [params, setParams] = useSearchParams();
    const teamParam = Number(params.get("team"));
    const { data, isPending, isError, error, refetch } = useTeams(WORLD_CUP_LEAGUE_ID);
    const { data: standings } = useStandings(WORLD_CUP_LEAGUE_ID);
    const nations = useMemo(() => data?.data.teams ?? [], [data]);
    /**
     * teamId -> group label. Built from the standings groups; a nation missing
     * from them (the draw not being complete, say) simply has no label rather
     * than being hidden.
     */
    const groupByTeam = useMemo(() => {
        const map = new Map();
        for (const group of standings?.data.standings ?? []) {
            for (const row of group) {
                const label = row.group;
                // Prefer a real "Group A" label over the catch-all "Group Stage" row
                // the provider also returns.
                if (label && (!map.has(row.team.id) || /group\s+[a-z]$/i.test(label))) {
                    map.set(row.team.id, label);
                }
            }
        }
        return map;
    }, [standings]);
    const grouped = useMemo(() => {
        const buckets = new Map();
        for (const entry of nations) {
            const label = groupByTeam.get(entry.team.id) ?? "";
            const bucket = buckets.get(label);
            if (bucket)
                bucket.push(entry);
            else
                buckets.set(label, [entry]);
        }
        // Named groups first and alphabetically; the unlabelled bucket last.
        return [...buckets.entries()].sort(([a], [b]) => {
            if (a === "")
                return 1;
            if (b === "")
                return -1;
            return a.localeCompare(b);
        });
    }, [nations, groupByTeam]);
    /**
     * Changes whenever the buckets themselves change, which is the moment the
     * reveal animation has to re-arm. Teams and standings are separate requests:
     * if teams land first the nations render as one unlabelled bucket, and the
     * later standings response replaces every <section> with new DOM. useReveal
     * fires once per mount, so without remounting here the replacement nodes
     * stay at the opacity:0 that html.is-animated gives them - the page shows
     * the grid's own background as empty grey bars.
     */
    const groupSignature = useMemo(() => grouped.map(([label, entries]) => `${label}:${entries.length}`).join("|"), [grouped]);
    const selectedId = Number.isFinite(teamParam) && nations.some((n) => n.team.id === teamParam)
        ? teamParam
        : undefined;
    const selected = nations.find((n) => n.team.id === selectedId);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    // Bring the squad into view on selection: it renders below a tall grid of
    // 48 nations, so without this a click looks like it did nothing.
    const squadRef = useRef(null);
    useEffect(() => {
        if (selectedId === undefined)
            return;
        squadRef.current?.scrollIntoView({
            behavior: MOTION_OK ? "smooth" : "auto",
            block: "start",
        });
    }, [selectedId]);
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { eyebrow: t("nations.eyebrow"), title: t("nations.title"), lede: t("nations.lede") }), _jsx("div", { className: "u-frame pb-section", children: isPending ? (_jsx("div", { className: "grid grid-cols-2 gap-px bg-ink-line sm:grid-cols-3 lg:grid-cols-4", children: _jsx(SkeletonList, { count: 12, children: () => _jsx(PlayerCardSkeleton, {}) }) })) : isError ? (_jsx(ErrorState, { error: error, onRetry: () => void refetch() })) : nations.length === 0 ? (_jsx(EmptyState, { headline: t("nations.emptyTitle"), detail: t("nations.emptyDetail") })) : (_jsxs(_Fragment, { children: [_jsx(NationGroups, { groups: grouped, selectedId: selectedId, onSelect: (id) => setParams({ team: String(id) }) }, groupSignature), selected && (
                        // scroll-mt keeps the heading clear of the fixed nav when
                        // scrollIntoView lands on it.
                        _jsx("div", { ref: squadRef, className: "scroll-mt-[calc(var(--nav-h)+1.5rem)]", children: _jsx(NationSquad, { team: selected.team, onSelectPlayer: setSelectedPlayer }, selected.team.id) }))] })) }), _jsx(PlayerModal, { player: selectedPlayer, team: selected?.team ?? null, leagueId: WORLD_CUP_LEAGUE_ID, season: WORLD_CUP_SEASON, onClose: () => setSelectedPlayer(null) })] }));
}
function NationGroups({ groups, selectedId, onSelect, }) {
    const scope = useReveal({ y: 16, stagger: 0.02, duration: 0.6 });
    const t = useT();
    return (_jsx("div", { ref: scope, className: "flex flex-col gap-10", children: groups.map(([label, entries]) => (_jsxs("section", { children: [_jsxs("h2", { className: "js-reveal u-eyebrow mb-4 flex items-center gap-2 text-ember", children: [_jsx("span", { className: "h-2 w-2 shrink-0 bg-ember", "aria-hidden": "true" }), label || t("nations.ungrouped")] }), _jsx("ul", { className: "grid grid-cols-2 gap-px border border-ink-line bg-ink-line sm:grid-cols-3 lg:grid-cols-4", children: entries.map((entry) => {
                        const active = entry.team.id === selectedId;
                        return (_jsx("li", { className: "js-reveal", children: _jsxs("button", { type: "button", onClick: () => onSelect(entry.team.id), "aria-pressed": active, className: `flex w-full items-center gap-3 p-4 text-left transition-colors
                                duration-300 ${active
                                    ? "bg-ember/[0.12] text-ink-bright"
                                    : "bg-ink text-ink-muted hover:bg-ink-raised hover:text-ink-bright"}`, children: [_jsx(TeamBadge, { team: entry.team, size: "sm" }), _jsx("span", { className: "min-w-0 truncate text-sm font-semibold", children: entry.team.name })] }) }, entry.team.id));
                    }) })] }, label || "ungrouped"))) }));
}
function NationSquad({ team, onSelectPlayer, }) {
    const t = useT();
    const { data, isPending, isError, error, refetch } = useSquad(team.id);
    const players = data?.data.players ?? [];
    return (_jsxs("section", { className: "mt-14 border-t border-ink-line pt-10", children: [_jsxs("h2", { className: "u-display mb-2 text-title text-ink-bright", children: [team.name, " \u2014 ", t("nations.squad")] }), _jsx("p", { className: "mb-8 max-w-xl text-xs leading-relaxed text-ink-muted", children: t("nations.clubNote") }), isPending ? (_jsx("div", { className: "grid gap-px bg-ink-line sm:grid-cols-2 lg:grid-cols-3", children: _jsx(SkeletonList, { count: 6, children: () => _jsx(PlayerCardSkeleton, {}) }) })) : isError ? (_jsx(ErrorState, { error: error, onRetry: () => void refetch() })) : players.length === 0 ? (_jsx(EmptyState, { headline: t("nations.squadEmptyTitle"), detail: t("nations.squadEmptyDetail") })) : (_jsx(SquadGrid, { players: players, onSelect: onSelectPlayer }))] }));
}
function SquadGrid({ players, onSelect, }) {
    const scope = useReveal({ y: 18, stagger: 0.03, duration: 0.7 });
    const t = useT();
    return (_jsx("div", { ref: scope, className: "grid grid-cols-1 gap-px border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-3", children: players.map((player) => (_jsx("article", { className: "js-reveal", children: _jsxs("button", { type: "button", onClick: () => onSelect(player), className: "group flex w-full items-center gap-3.5 bg-ink p-5 text-left transition-colors\n                       duration-500 ease-out hover:bg-ink-raised", children: [_jsx(PlayerAvatar, { name: player.name, playerId: player.id, ...(player.photo === undefined ? {} : { photo: player.photo }), className: "transition-transform duration-500 ease-out group-hover:scale-105" }), _jsxs("div", { className: "min-w-0", children: [_jsx("h3", { className: "truncate font-semibold text-ink-bright", children: player.name }), _jsxs("p", { className: "mt-0.5 truncate text-xs text-ink-muted", children: [player.number ? `#${player.number} · ` : "", player.position && isKnownPosition(player.position)
                                        ? t(`position.${player.position}`)
                                        : (player.position ?? "—")] })] })] }) }, player.id))) }));
}
