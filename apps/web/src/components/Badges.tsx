import { useState } from "react";
import { initials, teamHue, teamMark } from "@/lib/format";
import { playerPhotoUrl, type Team } from "@/lib/api";

const SIZES = {
  xs: "h-6 w-6 text-[0.5rem]",
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
  const [failed, setFailed] = useState(false);
  const mark = teamMark(team);
  const hue = teamHue(team.name);

  if (team.logo && !failed) {
    return (
      <img
        src={team.logo}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
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

/**
 * Player avatar. API-Football supplies headshots, but coverage is patchy for
 * academy and lower-division players, so a failed load falls back to the
 * initials disc rather than a broken-image icon.
 */
export function PlayerAvatar({
  name,
  playerId,
  photo,
  size = "md",
  className = "",
}: {
  name: string;
  playerId?: number;
  photo?: string;
  size?: Size;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = photo ?? (playerId === undefined ? undefined : playerPhotoUrl(playerId));

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${SIZES[size]} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} u-display grid shrink-0 place-items-center rounded-full
                  bg-ember/[0.12] text-ember ring-1 ring-inset ring-ember/25 ${className}`}
    >
      {initials(name)}
    </span>
  );
}

/**
 * Small uppercase label used for competitions, positions and statuses.
 *
 * tone="live" breaks the pill shape entirely for the .u-stamp treatment - the
 * one loud device in the system, so it can only mean one thing everywhere it
 * appears. It assumes an `ink` background (see .u-stamp in index.css); every
 * current call site (page-header asides, the match header) already sits on
 * one.
 */
export function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ember" | "live";
}) {
  if (tone === "live") {
    return (
      <span className="u-stamp u-eyebrow inline-flex items-center gap-1.5 bg-ink px-2.5 py-1 text-[0.625rem] text-ember-bright">
        <span className="h-1.5 w-1.5 animate-live rounded-full bg-ember-bright" />
        {children}
      </span>
    );
  }

  const tones = {
    neutral: "text-ink-muted ring-ink-line",
    // ember-bright, not ember: this pill can land on a hover surface
    // (ink-raised), where plain ember falls under the AA floor for small text.
    ember: "text-ember-bright ring-ember/35",
  };

  return (
    <span
      className={`u-eyebrow inline-flex items-center gap-1.5 rounded-full px-2.5 py-1
                  text-[0.625rem] ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
