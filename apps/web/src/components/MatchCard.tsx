import { Link } from "react-router-dom";
import { TeamBadge } from "./Badges";
import { isLive, leagueCodeFor, type Fixture, type Team } from "@/lib/api";
import { useStatusLabel, useT } from "@/context/LanguageContext";
import { matchTimeParts, scoreline } from "@/lib/format";

/**
 * A fixture row rather than a boxed card: hairline separators, the scoreline
 * set in tabular figures on the right, and a live match marked by an ember bar
 * down its leading edge. Hover lifts the row and lights that edge.
 *
 * `showLeague` adds a competition code under the kick-off time. Off by default:
 * on Fixtures and Standings the league is already established by the rail, so
 * the label would just repeat it. The homepage mixes ten competitions in one
 * list and needs it.
 */
export function MatchCard({ match, showLeague = false }: { match: Fixture; showLeague?: boolean }) {
  const t = useT();
  const statusLabel = useStatusLabel();
  const live = isLive(match);
  const { home, away } = scoreline(match);
  const played = home !== null && away !== null;
  const status = match.fixture.status.short;
  const finished = status === "FT" || status === "AET" || status === "PEN";
  const leagueCode = showLeague ? leagueCodeFor(match.league.id) : undefined;
  const { time, zone } = matchTimeParts(match.fixture.date);

  // Dim the losing side once a result stands - the eye should find the winner
  // without reading the numbers.
  const homeLost = finished && played && home < away;
  const awayLost = finished && played && away < home;

  return (
    <Link
      to={`/match/${match.fixture.id}`}
      className="group relative block border-b border-ink-line transition-all duration-500 ease-out
                 hover:z-10 hover:-translate-y-0.5 hover:bg-ink-raised hover:shadow-ember
                 focus-visible:z-10 focus-visible:bg-ink-raised"
    >
      {/* Leading edge: always present, only visible when live or hovered. Live
          gets a soft bleed of its own - a second, quieter glow than the hover
          shadow, so a live row reads as alive before you've scanned to the
          label. */}
      <span
        className={`absolute inset-y-0 left-0 w-1 transition-all duration-500 ease-out
                    ${live ? "bg-ember shadow-[0_0_16px_2px_rgba(204,85,0,0.55)]" : "bg-ember/0 group-hover:bg-ember/60"}`}
        aria-hidden="true"
      />

      <div className="flex items-center gap-4 py-4 pl-5 pr-4 sm:gap-6 sm:pl-7 sm:pr-6">
        {/* Wide enough for "05:00 PM" on one line with the zone beneath it,
            rather than breaking the clock itself across two. */}
        <div className="w-16 shrink-0 sm:w-20">
          {live ? (
            <span className="u-eyebrow flex items-center gap-1.5 text-ember-bright">
              <span className="h-1.5 w-1.5 animate-live rounded-full bg-ember-bright" />
              {match.fixture.status.elapsed
                ? `${match.fixture.status.elapsed}'`
                : t("match.live")}
            </span>
          ) : finished ? (
            <span className="block text-sm text-ink-muted">{statusLabel(status)}</span>
          ) : (
            <>
              {/* Intl separates the clock from AM/PM with a narrow *no-break*
                  space, so this cannot wrap - it has to fit on one line. Sized
                  down a step on mobile to guarantee that for the widest form
                  ("04:00 p.m."), which is wider than "05:00 PM". */}
              <span className="tnum block text-xs text-ink-muted sm:text-sm">{time}</span>
              {zone && (
                <span className="mt-0.5 block text-[0.625rem] leading-none text-ink-muted/70">
                  {zone}
                </span>
              )}
            </>
          )}

          {showLeague && leagueCode && (
            <span
              className="u-display mt-1.5 inline-block rounded-full border border-ink-line px-1.5
                         py-0.5 text-[0.5625rem] leading-none text-ink-muted"
            >
              {/* The code is the compact visual; the full name is what gets
                  announced, since "PPL" spelled out is not a competition. */}
              <span aria-hidden="true">{leagueCode}</span>
              <span className="sr-only">{match.league.name}</span>
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <TeamLine team={match.teams.home} dimmed={homeLost} />
          <TeamLine team={match.teams.away} dimmed={awayLost} />
        </div>

        <div className="shrink-0 text-right">
          {played ? (
            <div className="tnum u-display flex flex-col gap-2.5 text-xl leading-none sm:text-2xl">
              <span className={homeLost ? "text-ink-muted" : "text-ink-bright"}>{home}</span>
              <span className={awayLost ? "text-ink-muted" : "text-ink-bright"}>{away}</span>
            </div>
          ) : (
            <span className="u-eyebrow text-ink-muted">{statusLabel(status)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function TeamLine({ team, dimmed }: { team: Team; dimmed: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <TeamBadge team={team} size="sm" className={dimmed ? "opacity-45" : ""} />
      <span
        className={`truncate text-sm font-semibold sm:text-base ${
          dimmed ? "text-ink-muted" : "text-ink-bright"
        }`}
      >
        {team.name}
      </span>
    </div>
  );
}
