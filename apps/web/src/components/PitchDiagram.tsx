import { useMemo, useState } from "react";
import { TeamBadge } from "@/components/Badges";
import { useT } from "@/context/LanguageContext";
import { initials } from "@/lib/format";
import { playerPhotoUrl } from "@/lib/api";
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

/** Five points around the origin - shared by the ball's pentagon and its seams. */
const BALL_ANGLES = Array.from({ length: 5 }, (_, i) => ((2 * Math.PI) / 5) * i - Math.PI / 2);

const BALL_PENTAGON = BALL_ANGLES.map(
  (a) => `${(2.4 * Math.cos(a)).toFixed(2)},${(2.4 * Math.sin(a)).toFixed(2)}`,
).join(" ");

/**
 * A minimal ball for the goal-scorer badge: a plain white body, a centre
 * pentagon and five short seams - the classic hex/pentagon panel pattern
 * reduced to what still reads at 16px rather than reproduced in full.
 */
function BallIcon() {
  return (
    <g aria-hidden="true">
      <circle r={5} fill="#f5f5f5" />
      {BALL_ANGLES.map((a, i) => (
        <line
          key={i}
          x1={2.4 * Math.cos(a)}
          y1={2.4 * Math.sin(a)}
          x2={4.6 * Math.cos(a)}
          y2={4.6 * Math.sin(a)}
          stroke="#0a0a0a"
          strokeWidth={0.6}
        />
      ))}
      <polygon points={BALL_PENTAGON} fill="#0a0a0a" />
    </g>
  );
}

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

const AVATAR_R = 12;
/** Shared corner offset for every badge clustered around the avatar ring. */
const BADGE_OFFSET = AVATAR_R * 0.75;

/** Crude but renderer-agnostic: SVG text has no CSS text-overflow to lean on. */
function shortenName(name: string, max = 11): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

/**
 * Headshot with an initials fallback, drawn as plain SVG (image/circle/text)
 * rather than the foreignObject+HTML this used originally. foreignObject
 * turned out to not render at all in iOS Safari - every browser there is
 * WebKit under Apple's rules, so it wasn't just one browser to work around -
 * while the sibling badges below, which are already plain SVG, rendered
 * fine. Native SVG primitives sidestep the whole compatibility question.
 */
function PlayerAvatarMark({
  playerId,
  name,
  accentColor,
}: {
  playerId: number;
  name: string;
  accentColor: string;
}) {
  const [failed, setFailed] = useState(false);
  const clipId = `pitch-avatar-${playerId}`;

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <circle r={AVATAR_R} />
        </clipPath>
      </defs>

      <circle r={AVATAR_R + 2} fill="#0a0a0a" stroke={accentColor} strokeWidth={2} />

      {failed ? (
        <>
          <circle r={AVATAR_R} fill="#141414" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fontWeight={700}
            fill="#cc5500"
          >
            {initials(name)}
          </text>
        </>
      ) : (
        <image
          href={playerPhotoUrl(playerId)}
          x={-AVATAR_R}
          y={-AVATAR_R}
          width={AVATAR_R * 2}
          height={AVATAR_R * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}

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
      <title>{tooltip}</title>

      <PlayerAvatarMark playerId={entry.player.id} name={entry.player.name} accentColor={accentColor} />

      {/* Number, cards, goals and subs all cluster in the four corners of the
          avatar ring rather than out at the edges of the old name-label box -
          they read as one badge group instead of scattered icons. */}
      <g transform={`translate(${BADGE_OFFSET},${BADGE_OFFSET})`}>
        <circle r={6.5} fill="#0a0a0a" stroke={accentColor} strokeWidth={1.5} />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={7}
          fontWeight={700}
          fill="#f5f5f5"
          className="tnum"
        >
          {entry.player.number ?? ""}
        </text>
      </g>

      {badges?.red ? (
        <rect x={BADGE_OFFSET - 3.5} y={-BADGE_OFFSET - 5} width={7} height={10} rx={1} fill="#8b0000" />
      ) : badges?.yellow ? (
        <rect x={BADGE_OFFSET - 3.5} y={-BADGE_OFFSET - 5} width={7} height={10} rx={1} fill="#facc15" />
      ) : null}

      {/* Full name on hover/tap via the <title> above; the label itself is
          desktop-only so 22 of them never collide on mobile. */}
      <text
        y={AVATAR_R + 14}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
        fill="#f5f5f5"
        className="hidden sm:block"
      >
        {shortenName(entry.player.name)}
      </text>

      {badges && badges.goals > 0 ? (
        <g transform={`translate(${-BADGE_OFFSET},${-BADGE_OFFSET})`}>
          <circle r={7} fill="#0a0a0a" stroke="#ff6f14" strokeWidth={1.3} />
          <BallIcon />
          {badges.goals > 1 && (
            <text
              x={-9}
              y={-1}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={7}
              fontWeight={700}
              fill="#f5f5f5"
              className="tnum"
            >
              ×{badges.goals}
            </text>
          )}
        </g>
      ) : null}

      {badges?.subOff ? (
        <g transform={`translate(${-BADGE_OFFSET},${BADGE_OFFSET})`}>
          <circle r={6.5} fill="#0a0a0a" stroke="#34d399" strokeWidth={1.2} />
          <path
            d="M-2.6 -1.3h4.4l-1.4-1.4M2.6 1.3h-4.4l1.4 1.4"
            stroke="#34d399"
            strokeWidth={1.1}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : null}
    </g>
  );
}
