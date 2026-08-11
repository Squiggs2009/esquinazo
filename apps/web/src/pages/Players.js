import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlayerAvatar, Chip, TeamBadge } from "@/components/Badges";
import { LeagueRail } from "@/components/LeagueRail";
import { PlayerModal } from "@/components/PlayerModal";
import { PositionLegend } from "@/components/PositionLegend";
import { PlayerCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useT } from "@/context/LanguageContext";
import { useSquad, useTeams } from "@/lib/queries";
import { useReveal } from "@/lib/motion";
import { DEFAULT_LEAGUE_ID, LEAGUES } from "@/lib/api";
import { isKnownPosition, POSITION_ORDER } from "@/lib/i18n";
/**
 * API-Football's season numbering is competition-specific rather than a
 * shared calendar year - Liga MX's Apertura runs under a different year than
 * a European league's current season would. The player stat modal only
 * covers Liga MX so far (see PlayerModal's leagueId/season props), so this is
 * the one competition this page can pass a season for.
 */
const LIGA_MX_LEAGUE_ID = 262;
const LIGA_MX_SEASON = 2026;
/**
 * The API exposes players a squad at a time (GET /players?team=<id>), so this
 * page is "pick a league, then a club, then search within its squad" rather
 * than a global index. The club list comes from GET /teams?league=, backed by
 * API-Football's /teams - the same LeagueRail used on Fixtures/Standings
 * drives which competition is active.
 */
export default function Players() {
    const t = useT();
    useTitle(t("players.title"));
    const [params, setParams] = useSearchParams();
    const teamParam = Number(params.get("team"));
    const playerParam = Number(params.get("player"));
    const leagueParam = Number(params.get("league"));
    const [search, setSearch] = useState("");
    // Seeded from the URL once, on mount: a Wire entry's deep link names the
    // team's actual competition (e.g. Liga MX), which may not be the site's
    // default (Premier League). Without this, ?team= would be checked against
    // the wrong league's roster and silently never match. Only the initial URL
    // value is honoured - later league switches go through the rail's onChange.
    const [competition, setCompetition] = useState(() => LEAGUES.some((l) => l.id === leagueParam) ? leagueParam : DEFAULT_LEAGUE_ID);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    // Guards the deep-link auto-open to a single attempt, so closing the modal
    // (or a background squad refetch) never reopens it on its own.
    const autoOpenedPlayerRef = useRef(false);
    const { data: teamsResponse, isPending: teamsPending, isError: teamsError, error: teamsErrorDetail, refetch: refetchTeams, } = useTeams(competition);
    const teams = useMemo(() => teamsResponse?.data.teams ?? [], [teamsResponse]);
    // Prefer a URL-supplied team (e.g. a Standings row link) as long as it
    // belongs to the currently selected league; otherwise fall back to that
    // league's first club. Derived directly from render inputs rather than an
    // effect that writes the fallback back into the URL - there is nothing to
    // reconcile, so nothing needs to run after the fact.
    const teamId = useMemo(() => {
        const fromUrl = Number.isFinite(teamParam) && teamParam > 0 ? teamParam : undefined;
        if (fromUrl !== undefined && teams.some((entry) => entry.team.id === fromUrl)) {
            return fromUrl;
        }
        return teams[0]?.team.id;
    }, [teamParam, teams]);
    const { data, isPending, isError, error, refetch } = useSquad(teamId);
    const squad = data?.data.players ?? [];
    const team = data?.data.team ?? null;
    // Opens the stat modal for a Wire-linked player once their squad has
    // actually loaded - matches what clicking their card would do, just
    // triggered by the URL instead of a click. Waiting for teamId === teamParam
    // (rather than just teamId) confirms the league resolved to the URL's team
    // rather than a same-league fallback club that happens to be selected
    // while data is still settling.
    useEffect(() => {
        if (autoOpenedPlayerRef.current)
            return;
        if (!Number.isFinite(playerParam) || playerParam <= 0)
            return;
        if (teamId !== teamParam)
            return;
        if (isPending || !data)
            return;
        autoOpenedPlayerRef.current = true;
        const match = data.data.players.find((player) => player.id === playerParam);
        if (match)
            setSelectedPlayer(match);
    }, [playerParam, teamParam, teamId, isPending, data]);
    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle)
            return squad;
        return squad.filter((player) => player.name.toLowerCase().includes(needle) ||
            (player.position ?? "").toLowerCase().includes(needle) ||
            String(player.number ?? "").includes(needle));
    }, [squad, search]);
    const league = LEAGUES.find((l) => l.id === competition);
    const leagueName = league?.name ?? String(competition);
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { eyebrow: t("players.eyebrow"), title: t("players.title"), lede: t("players.lede") }), _jsxs("div", { className: "u-frame grid gap-10 pb-section lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14", children: [_jsx(LeagueRail, { value: competition, onChange: (leagueId) => {
                            setCompetition(leagueId);
                            // Let teamId re-derive to the new league's first club instead of
                            // carrying the old league's id in the URL until it's overwritten.
                            setParams({}, { replace: true });
                        } }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "mb-8 flex flex-col gap-4 border-b border-ink-line pb-6 sm:flex-row sm:items-end", children: [_jsxs("label", { className: "flex-1", children: [_jsx("span", { className: "u-eyebrow mb-2 block", children: t("players.club", { league: leagueName }) }), _jsx("select", { value: teamId ?? "", onChange: (event) => setParams({ team: event.target.value }), disabled: teamsPending || teams.length === 0, className: "w-full border border-ink-line bg-ink-raised px-4 py-3 text-sm text-ink-bright\n                           transition-colors duration-300 hover:border-ink-muted focus:border-ember\n                           disabled:opacity-50", children: teams.map((entry) => (_jsx("option", { value: entry.team.id, children: entry.team.name }, entry.team.id))) })] }), _jsxs("label", { className: "flex-1", children: [_jsx("span", { className: "u-eyebrow mb-2 block", children: t("players.search") }), _jsx("input", { type: "search", value: search, onChange: (event) => setSearch(event.target.value), placeholder: t("players.searchPlaceholder"), className: "w-full border border-ink-line bg-ink-raised px-4 py-3 text-sm text-ink-bright\n                           placeholder:text-ink-muted/70 transition-colors duration-300\n                           hover:border-ink-muted focus:border-ember" })] })] }), _jsx(PositionLegend, {}), teamsError ? (_jsx(ErrorState, { error: teamsErrorDetail, onRetry: () => void refetchTeams() })) : (_jsxs(_Fragment, { children: [team && (_jsxs("div", { className: "mb-8 flex items-center gap-4", children: [_jsx(TeamBadge, { team: team, size: "lg" }), _jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "u-display truncate text-title text-ink-bright", children: team.name }), _jsx("p", { className: "mt-1 text-xs text-ink-muted", children: t("players.registered", { count: squad.length }) })] })] })), teamsPending || isPending ? (_jsx("div", { className: "grid gap-px bg-ink-line sm:grid-cols-2 lg:grid-cols-3", children: _jsx(SkeletonList, { count: 9, children: () => _jsx(PlayerCardSkeleton, {}) }) })) : isError ? (_jsx(ErrorState, { error: error, onRetry: () => void refetch() })) : filtered.length === 0 ? (_jsx(EmptyState, { headline: search ? t("players.noMatchTitle") : t("players.unavailableTitle"), detail: search
                                            ? t("players.noMatchDetail", { search })
                                            : t("players.unavailableDetail"), action: search ? (_jsx("button", { type: "button", onClick: () => setSearch(""), className: "u-display border border-ember px-5 py-2 text-xs uppercase tracking-wider\n                                   text-ember transition-colors duration-300 hover:bg-ember hover:text-ink", children: t("players.clearSearch") })) : undefined })) : (_jsx(GroupedSquad, { players: filtered, onSelect: setSelectedPlayer }, `${teamId}-${search}`))] }))] })] }), _jsx(PlayerModal, { player: selectedPlayer, team: team, onClose: () => setSelectedPlayer(null), ...(competition === LIGA_MX_LEAGUE_ID
                    ? { leagueId: LIGA_MX_LEAGUE_ID, season: LIGA_MX_SEASON }
                    : {}) })] }));
}
/**
 * Groups a squad into the four categories the provider reports, in playing
 * order rather than alphabetically. Anything with an unrecognised position
 * falls into a trailing "other" bucket instead of being dropped.
 */
function groupByPosition(players) {
    const buckets = new Map();
    const other = [];
    for (const player of players) {
        if (isKnownPosition(player.position)) {
            const bucket = buckets.get(player.position);
            if (bucket)
                bucket.push(player);
            else
                buckets.set(player.position, [player]);
        }
        else {
            other.push(player);
        }
    }
    const groups = POSITION_ORDER.filter((p) => buckets.has(p)).map((position) => [position, buckets.get(position) ?? []]);
    return { groups, other };
}
function GroupedSquad({ players, onSelect, }) {
    const scope = useReveal({ y: 18, stagger: 0.03, duration: 0.7 });
    const t = useT();
    const { groups, other } = groupByPosition(players);
    return (_jsxs("div", { ref: scope, className: "flex flex-col gap-10", children: [groups.map(([position, group]) => (_jsxs("section", { children: [_jsxs("h3", { className: "js-reveal u-eyebrow mb-4 flex items-center gap-2 text-ember", children: [_jsx("span", { className: "h-2 w-2 shrink-0 bg-ember", "aria-hidden": "true" }), t(`position.group${position}`), _jsx("span", { className: "tnum ml-1 text-ink-muted", children: group.length })] }), _jsx(PlayerGrid, { players: group, onSelect: onSelect })] }, position))), other.length > 0 && _jsx(PlayerGrid, { players: other, onSelect: onSelect })] }));
}
function PlayerGrid({ players, onSelect, }) {
    const t = useT();
    return (_jsx("div", { className: "grid grid-cols-1 gap-px border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-3", children: players.map((player) => (_jsx("article", { className: "js-reveal", children: _jsxs("button", { type: "button", onClick: () => onSelect(player), className: "group block w-full bg-ink p-5 text-left transition-colors duration-500\n                       ease-out hover:bg-ink-raised", children: [_jsxs("div", { className: "flex items-center gap-3.5", children: [_jsx(PlayerAvatar, { name: player.name, playerId: player.id, ...(player.photo === undefined ? {} : { photo: player.photo }), className: "transition-transform duration-500 ease-out group-hover:scale-105" }), _jsxs("div", { className: "min-w-0", children: [_jsx("h4", { className: "truncate font-semibold text-ink-bright", children: player.name }), _jsxs("p", { className: "mt-0.5 truncate text-xs text-ink-muted", children: [player.number ? `#${player.number}` : "—", player.age ? ` · ${player.age}` : ""] })] })] }), player.position && (_jsx("div", { className: "mt-5", children: _jsx(Chip, { tone: "ember", children: isKnownPosition(player.position)
                                ? t(`position.${player.position}`)
                                : player.position }) }))] }) }, player.id))) }));
}
