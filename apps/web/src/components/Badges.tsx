import { initials, teamHue, teamMark } from "@/lib/format";
import type { Team } from "@/lib/api";

const SIZES = {
  sm: "h-8 w-8 text-[0.625rem]",
  md: "h-11 w-11 text-xs",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-2xl",
} as const;

type Size = keyof typeof SIZES;

/**
 * Club badge. Uses the crest when the feed has one and falls back to an
 * initials disc tinted by a hue derived from the club name, so the fallback
 * still distinguishes clubs at a glance instead of being a wall of orange.
 */
export function TeamBadge({
  team,
  size = "md",
  className = "",
}: {
  team: Team;
  size?: Size;
  className?: string;
}) {
  const mark = teamMark(team);
  const hue = teamHue(team.name);

  if (team.crest) {
    return (
      <img
        src={team.crest}
        alt=""
        loading="lazy"
        className={`${SIZES[size]} shrink-0 rounded-full object-contain ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} u-display grid shrink-0 place-items-center rounded-full
                  text-ink-bright ring-1 ring-inset ring-white/10 ${className}`}
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 78% 34%), hsl(${hue - 6} 82% 20%))`,
      }}
    >
      {mark}
    </span>
  );
}

/** Player avatar: initials only, since the feed carries no photographs. */
export function PlayerAvatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} u-display grid shrink-0 place-items-center rounded-full
                  bg-ember/12 text-ember ring-1 ring-inset ring-ember/25 ${className}`}
    >
      {initials(name)}
    </span>
  );
}

/** Small uppercase label used for competitions, positions and statuses. */
export function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ember" | "live";
}) {
  const tones = {
    neutral: "text-ink-muted ring-ink-line",
    ember: "text-ember ring-ember/35",
    live: "text-ember-bright ring-ember/50",
  };

  return (
    <span
      className={`u-eyebrow inline-flex items-center gap-1.5 rounded-full px-2.5 py-1
                  text-[0.625rem] ring-1 ${tones[tone]}`}
    >
      {tone === "live" && (
        <span className="h-1.5 w-1.5 animate-live rounded-full bg-ember-bright" />
      )}
      {children}
    </span>
  );
}
