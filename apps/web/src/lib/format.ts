import type { Match, Team } from "./api";

/** "Lionel Messi" -> "LM", "Vinícius" -> "VI". Never more than two glyphs. */
export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return (words[0] ?? "").slice(0, 2).toUpperCase();

  const first = words[0]?.[0] ?? "";
  const last = words[words.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

/** Prefer the club's own three-letter abbreviation when the feed supplies one. */
export function teamMark(team: Team): string {
  return team.tla ?? initials(team.shortName ?? team.name);
}

/**
 * Deterministic hue per club so badges stay visually distinct without ever
 * straying from the warm end of the palette.
 */
export function teamHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }
  // 8deg (deep red) through 44deg (amber).
  return 8 + (hash % 37);
}

const kickoffFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const articleFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const kickoffTime = (iso: string) => kickoffFormatter.format(new Date(iso));
export const matchDay = (iso: string) => dayFormatter.format(new Date(iso));
export const articleDate = (iso: string) => articleFormatter.format(new Date(iso));

const weekLabelFormatter = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay(); // 0 (Sun) - 6 (Sat)
  start.setDate(start.getDate() - ((day + 6) % 7)); // back to Monday
  return start;
}

/**
 * Local calendar date, not toISOString().slice(0, 10) - that converts through
 * UTC first, which silently shifts the date backward by a day for anyone in a
 * positive UTC offset (most of Europe) whenever local midnight falls before
 * UTC midnight.
 */
function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** The Monday-Sunday window `offset` weeks from the current week. */
export function weekRange(offset: number): {
  from: string;
  to: string;
  label: string;
  rangeText: string;
} {
  const monday = startOfWeek(new Date());
  monday.setDate(monday.getDate() + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const rangeText = `${weekLabelFormatter.format(monday)} – ${weekLabelFormatter.format(sunday)}`;
  const label =
    offset === 0 ? "This week" : offset === -1 ? "Last week" : offset === 1 ? "Next week" : rangeText;

  return { from: toLocalISODate(monday), to: toLocalISODate(sunday), label, rangeText };
}

/** Groups matches under a day heading, preserving chronological order. */
export function groupByDay(matches: Match[]): Array<[string, Match[]]> {
  const buckets = new Map<string, Match[]>();

  for (const match of [...matches].sort((a, b) => a.utcDate.localeCompare(b.utcDate))) {
    const key = matchDay(match.utcDate);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(match);
    else buckets.set(key, [match]);
  }

  return [...buckets.entries()];
}

export function scoreline(match: Match): { home: number | null; away: number | null } {
  return {
    home: match.score?.fullTime?.home ?? null,
    away: match.score?.fullTime?.away ?? null,
  };
}

const STATUS_COPY: Record<string, string> = {
  SCHEDULED: "Scheduled",
  TIMED: "Kick-off",
  IN_PLAY: "Live",
  PAUSED: "Half-time",
  FINISHED: "Full-time",
  POSTPONED: "Postponed",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
};

export const statusLabel = (status: string) => STATUS_COPY[status] ?? status.replace(/_/g, " ");

/** Splits "WWDLW" into the five most recent results, newest last. */
export function formGuide(form: string | null | undefined): Array<"W" | "D" | "L"> {
  if (!form) return [];
  return form
    .split(/[,\s]*/)
    .filter((c): c is "W" | "D" | "L" => c === "W" || c === "D" || c === "L")
    .slice(-5);
}
