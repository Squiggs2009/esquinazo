import { useMemo } from "react";
import { PlayerAvatar, TeamBadge } from "@/components/Badges";
import { useT } from "@/context/LanguageContext";
import type { Lineup, LineupPlayer, MatchEvent } from "@/lib/api";
import type { TranslationKey } from "@/lib/i18n";

/**
 * A tactical pitch per team: a portrait full-pitch diagram with the starting
 * XI plotted by their `grid` ("row:col") position, goalkeeper nearest their
 * own goal line at the bottom and attackers pushed toward the top. Both teams
 * read the same way, so home/away sit side by side rather than mirrored -
 * mirroring would make the away team's numbers run backwards relative to how
 * their own broadcast graphics show them.
 */

const VIEW_W = 400;
const VIEW_H = 640;

const FIELD = { left: 10, right: VIEW_W - 10, top: 10, bottom: VIEW_H - 10 };
const ROW_Y_TOP = FIELD.top + 65;
const ROW_Y_BOTTOM = FIELD.bottom - 65;
const ROW_X_MARGIN = 55;

const POSITION_LABEL_KEYS: Record<string, TranslationKey> = {
  G: "position.Goalkeeper",
  D: "position.Defender",
  M: "position.Midfielder",
  F: "position.Attacker",
};

/** 5-point star, centered at the origin, for the goal-scorer badge. */
const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const angle = (Math.PI / 5) * i - Math.PI / 2;
  const r = i % 2 === 0 ? 6 : 2.6;
  return `${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`;
}).join(" ");

interface PositionedPlayer {
  entry: LineupPlayer;
  x: number;
  y: number;
}

interface PlayerBadges {
  yellow: boolean;
  red: boolean;
  goals: number;
  subOff: boolean;
}

/**
 * Places the starting XI within the pitch bounds from their `grid` field.
 * Rows spread evenly between the goal line and the halfway line regardless of
 * how many bands the formation has (4-3-3 has four, 4-2-3-1 has five); within
 * a row, players rank by column rather than trusting the provider's column
 * numbers to be evenly spaced. Returns null if any starter lacks a grid
 * position, which the caller treats as "nothing to draw".
 */
function layoutFormation(lineup: Lineup): PositionedPlayer[] | null {
  const withGrid: Array<{ entry: LineupPlayer; row: number; col: number }> = [];

  for (const entry of lineup.startXI) {
    const [rowPart, colPart] = (entry.player.grid ?? "").split(":");
    const row = Number.parseInt(rowPart ?? "", 10);
    const col = Number.parseInt(colPart ?? "", 10);
    if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
    withGrid.push({ entry, row, col });
  }

  if (withGrid.length === 0) return null;

  const byRow = new Map<number, typeof withGrid>();
  for (const item of withGrid) {
    const bucket = byRow.get(item.row);
    if (bucket) bucket.push(item);
    else byRow.set(item.row, [item]);
  }

  const rows = [...byRow.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, items]) => items.sort((a, b) => a.col - b.col));

  return rows.flatMap((row, rowIndex) => {
    const y =
      rows.length === 1
        ? (ROW_Y_TOP + ROW_Y_BOTTOM) / 2
        : ROW_Y_BOTTOM - (rowIndex / (rows.length - 1)) * (ROW_Y_BOTTOM - ROW_Y_TOP);

    return row.map((item, rank) => {
      const x =
        row.length === 1
          ? (FIELD.left + FIELD.right) / 2
          : FIELD.left +
            ROW_X_MARGIN +
            (rank / (row.length - 1)) * (FIELD.right - FIELD.left - 2 * ROW_X_MARGIN);

      return { entry: item.entry, x, y };
    });
  });
}

/**
 * Cards, goals and subs, keyed by player id across both teams - ids are
 * unique per match so one pass over the events covers everyone.
 */
function buildBadges(events: MatchEvent[]): Map<number, PlayerBadges> {
  const map = new Map<number, PlayerBadges>();
  const get = (id: number) => {
    let badges = map.get(id);
    if (!badges) {
      badges = { yellow: false, red: false, goals: 0, subOff: false };
      map.set(id, badges);
    }
    return badges;
  };

  for (const event of events) {
    const playerId = event.player?.id;
    if (!playerId) continue;
    const detail = (event.detail ?? "").toLowerCase();

    if (event.type === "Card") {
      if (detail.includes("red")) get(playerId).red = true;
      else get(playerId).yellow = true;
    } else if (event.type === "subst") {
      // `player` is the one coming OFF for substitution events - verified
      // against the starting XI in MatchDetail's Timeline.
      get(playerId).subOff = true;
    } else if (event.type === "Goal" && !detail.includes("missed")) {
      get(playerId).goals += 1;
    }
  }

  return map;
}

export function PitchDiagram({
  lineups,
  events,
  homeTeamId,
}: {
  lineups: Lineup[];
  events: MatchEvent[];
  homeTeamId: number;
}) {
  const t = useT();
  const badges = useMemo(() => buildBadges(events), [events]);

  const home = lineups.find((l) => l.team.id === homeTeamId);
  const away = lineups.find((l) => l.team.id !== homeTeamId);
  const homeLayout = useMemo(() => (home ? layoutFormation(home) : null), [home]);
  const awayLayout = useMemo(() => (away ? layoutFormation(away) : null), [away]);

  // No grid data (some competitions omit it): fall back silently to the
  // lineup list further down the page rather than showing an empty pitch.
  if (!home || !away || !homeLayout || !awayLayout) return null;

  return (
    <section className="u-frame js-reveal pb-2 pt-10 sm:pt-12">
      <h2 className="u-eyebrow mb-6">{t("match.formations")}</h2>
      <div className="grid gap-8 sm:grid-cols-2">
        <TeamPitch lineup={home} players={homeLayout} badges={badges} accent="home" />
        <TeamPitch lineup={away} players={awayLayout} badges={badges} accent="away" />
      </div>
    </section>
  );
}

function TeamPitch({
  lineup,
  players,
  badges,
  accent,
}: {
  lineup: Lineup;
  players: PositionedPlayer[];
  badges: Map<number, PlayerBadges>;
  accent: "home" | "away";
}) {
  return (
    <div className="min-w-0">
      <div className="mb-4 flex items-center gap-3">
        <TeamBadge team={lineup.team} size="sm" />
        <h3 className="u-display min-w-0 flex-1 truncate text-sm text-ink-bright">
          {lineup.team.name}
        </h3>
        {lineup.formation && (
          <span className="tnum u-eyebrow shrink-0 text-ember">{lineup.formation}</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`${lineup.team.name}${lineup.formation ? ` — ${lineup.formation}` : ""}`}
        className="w-full border border-ink-line"
      >
        <PitchField />
        {players.map((player) => (
          <PlayerDot
            key={player.entry.player.id}
            player={player}
            accent={accent}
            badges={badges.get(player.entry.player.id)}
          />
        ))}
      </svg>
    </div>
  );
}

/** Static pitch markings: shared by both team panels, independent of data. */
function PitchField() {
  const stripeCount = 8;
  const stripeHeight = (FIELD.bottom - FIELD.top) / stripeCount;

  return (
    <g aria-hidden="true">
      {/* Mowing stripes - a hint of texture rather than a flat fill. */}
      {Array.from({ length: stripeCount }, (_, i) => (
        <rect
          key={i}
          x={FIELD.left}
          y={FIELD.top + i * stripeHeight}
          width={FIELD.right - FIELD.left}
          height={stripeHeight}
          fill={i % 2 === 0 ? "#1d3b28" : "#204020"}
        />
      ))}

      <g fill="none" stroke="#f5f5f5" strokeOpacity={0.55} strokeWidth={1.5}>
        <rect
          x={FIELD.left}
          y={FIELD.top}
          width={FIELD.right - FIELD.left}
          height={FIELD.bottom - FIELD.top}
        />
        <line x1={FIELD.left} y1={320} x2={FIELD.right} y2={320} />
        <circle cx={200} cy={320} r={55} />

        {/* Penalty areas */}
        <rect x={87.5} y={FIELD.top} width={225} height={97} />
        <rect x={87.5} y={FIELD.bottom - 97} width={225} height={97} />

        {/* Six-yard boxes */}
        <rect x={149} y={FIELD.top} width={102} height={32.5} />
        <rect x={149} y={FIELD.bottom - 32.5} width={102} height={32.5} />

        {/* Penalty arcs */}
        <path d="M 155.3 107 A 55 55 0 0 1 244.7 107" />
        <path d="M 155.3 533 A 55 55 0 0 0 244.7 533" />

        {/* Corner arcs */}
        <path d={`M ${FIELD.left} ${FIELD.top + 12} A 12 12 0 0 1 ${FIELD.left + 12} ${FIELD.top}`} />
        <path d={`M ${FIELD.right - 12} ${FIELD.top} A 12 12 0 0 1 ${FIELD.right} ${FIELD.top + 12}`} />
        <path
          d={`M ${FIELD.left} ${FIELD.bottom - 12} A 12 12 0 0 0 ${FIELD.left + 12} ${FIELD.bottom}`}
        />
        <path d={`M ${FIELD.right - 12} ${FIELD.bottom} A 12 12 0 0 0 ${FIELD.right} ${FIELD.bottom - 12}`} />
      </g>

      <circle cx={200} cy={320} r={2.5} fill="#f5f5f5" fillOpacity={0.55} />
    </g>
  );
}

const DOT_W = 76;
const DOT_H = 90;

function PlayerDot({
  player,
  accent,
  badges,
}: {
  player: PositionedPlayer;
  accent: "home" | "away";
  badges?: PlayerBadges;
}) {
  const t = useT();
  const { entry, x, y } = player;
  const posKey = entry.player.pos ? POSITION_LABEL_KEYS[entry.player.pos] : undefined;
  const posLabel = posKey ? t(posKey) : "";
  const accentColor = accent === "home" ? "#ff6f14" : "#f5f5f5";
  const dimmed = badges?.subOff ?? false;
  const tooltip = posLabel ? `${entry.player.name} — ${posLabel}` : entry.player.name;

  return (
    <g transform={`translate(${x} ${y})`} opacity={dimmed ? 0.45 : 1}>
      <foreignObject x={-DOT_W / 2} y={-DOT_H / 2} width={DOT_W} height={DOT_H}>
        <div
          {...{ xmlns: "http://www.w3.org/1999/xhtml" }}
          title={tooltip}
          className="flex h-full flex-col items-center gap-1 pt-1"
        >
          <div className="relative shrink-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${accentColor}` }}>
            <PlayerAvatar name={entry.player.name} playerId={entry.player.id} size="xs" />

            <span
              className="tnum absolute -bottom-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full
                         bg-ink text-[0.5rem] font-bold leading-none text-ink-bright"
              style={{ boxShadow: `0 0 0 1.5px ${accentColor}` }}
            >
              {entry.player.number ?? ""}
            </span>

            {badges?.red ? (
              <span className="absolute -right-1 -top-1 h-2.5 w-[0.4375rem] rounded-[1px] bg-blood" />
            ) : badges?.yellow ? (
              <span className="absolute -right-1 -top-1 h-2.5 w-[0.4375rem] rounded-[1px] bg-yellow-400" />
            ) : null}
          </div>

          {/* Full name on hover/tap via the native title above; the label
              itself is desktop-only so 22 of them never collide on mobile. */}
          <span className="hidden w-full truncate text-center text-[0.5rem] font-semibold leading-tight text-ink-bright sm:block">
            {entry.player.name}
          </span>
        </div>
      </foreignObject>

      {badges && badges.goals > 0 ? (
        <g transform={`translate(${-DOT_W / 2 + 8},${-DOT_H / 2 + 8})`}>
          <circle r={8} fill="#0a0a0a" stroke="#ff6f14" strokeWidth={1.5} />
          <polygon points={STAR_POINTS} fill="#ff6f14" />
          {badges.goals > 1 && (
            <text x={13} y={3} fontSize={9} fontWeight={700} fill="#f5f5f5" className="tnum">
              ×{badges.goals}
            </text>
          )}
        </g>
      ) : null}

      {badges?.subOff ? (
        <g transform={`translate(${DOT_W / 2 - 8},${-DOT_H / 2 + 8})`}>
          <circle r={7} fill="#0a0a0a" stroke="#34d399" strokeWidth={1.3} />
          <path
            d="M-3 -1.5h5l-1.6-1.6M3 1.5h-5l1.6 1.6"
            stroke="#34d399"
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : null}
    </g>
  );
}
