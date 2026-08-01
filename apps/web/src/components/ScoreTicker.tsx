import { Link } from "react-router-dom";
import { isLive, type Fixture } from "@/lib/api";
import { useT } from "@/context/LanguageContext";
import { formatMatchTime, scoreline, teamMark } from "@/lib/format";
import { MOTION_OK } from "@/lib/motion";

/**
 * Broadcast-style score bar. The track is duplicated and translated -50% so the
 * loop is seamless; duration scales with content so ten matches do not race
 * past at the same speed as two.
 */
export function ScoreTicker({ matches }: { matches: Fixture[] }) {
  const t = useT();
  if (matches.length === 0) return null;

  const duration = Math.max(28, matches.length * 6);
  const track = [...matches, ...matches];

  return (
    <div
      className="relative overflow-hidden border-y border-ink-line bg-ink-raised/70"
      aria-label={t("home.liveNow")}
    >
      {/* Fade the edges so entries dissolve rather than clip. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent" />

      <div
        className={`flex w-max ${MOTION_OK ? "animate-ticker" : "overflow-x-auto"}`}
        style={{ ["--ticker-duration" as string]: `${duration}s` }}
      >
        {track.map((match, index) => (
          <TickerItem
            key={`${match.fixture.id}-${index}`}
            match={match}
            duplicate={index >= matches.length}
          />
        ))}
      </div>
    </div>
  );
}

function TickerItem({ match, duplicate }: { match: Fixture; duplicate: boolean }) {
  const { home, away } = scoreline(match);
  const played = home !== null && away !== null;
  const live = isLive(match);

  return (
    <Link
      to={`/match/${match.fixture.id}`}
      // The cloned half is decorative - keep it out of the a11y tree and tab order.
      {...(duplicate ? { "aria-hidden": true, tabIndex: -1 } : {})}
      className="group flex shrink-0 items-center gap-3 border-r border-ink-line px-5 py-3
                 transition-colors duration-300 hover:bg-ink-raised"
    >
      {live && <span className="h-1.5 w-1.5 animate-live rounded-full bg-ember-bright" />}

      <span className="u-display text-xs text-ink-muted transition-colors group-hover:text-ink-bright">
        {teamMark(match.teams.home)}
      </span>

      <span className="tnum u-display text-sm text-ink-bright">
        {played ? `${home}–${away}` : formatMatchTime(match.fixture.date)}
      </span>

      <span className="u-display text-xs text-ink-muted transition-colors group-hover:text-ink-bright">
        {teamMark(match.teams.away)}
      </span>
    </Link>
  );
}
