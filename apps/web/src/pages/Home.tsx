import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ScoreTicker } from "@/components/ScoreTicker";
import { Headlines } from "@/components/Headlines";
import { MatchCard } from "@/components/MatchCard";
import { MatchCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { ErrorState } from "@/components/States";
import { useTitle } from "@/components/PageShell";
import { useFixtures } from "@/lib/queries";
import { EASE, gsap, MOTION_OK, useCounter, useParallax, useReveal } from "@/lib/motion";
import { isLive } from "@/lib/api";

export default function Home() {
  useTitle("Football, measured");

  const { data, isPending, isError, error, refetch } = useFixtures();
  const matches = data?.data.matches ?? [];
  const live = matches.filter(isLive);
  const ticker = live.length > 0 ? live : matches.slice(0, 12);

  return (
    <>
      <Hero />
      <ScoreTicker matches={ticker} />
      <Counters matchCount={matches.length} />
      <Headlines />

      <section className="u-frame py-section">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="u-eyebrow flex items-center gap-2 text-ember-bright">
              <span className="h-2 w-2 shrink-0 bg-ember" aria-hidden="true" />
              {live.length > 0 ? "In play" : "Next up"}
            </p>
            <h2 className="u-display mt-3 text-title">
              {live.length > 0 ? "Live right now" : "Today's fixtures"}
            </h2>
          </div>
          <Link to="/fixtures" className="u-display text-xs text-ember hover:text-ember-bright">
            All fixtures →
          </Link>
        </div>

        {isPending ? (
          <SkeletonList count={5}>{() => <MatchCardSkeleton />}</SkeletonList>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <FixtureList matches={(live.length > 0 ? live : matches).slice(0, 6)} />
        )}
      </section>
    </>
  );
}

function FixtureList({ matches }: { matches: Parameters<typeof MatchCard>[0]["match"][] }) {
  const scope = useReveal<HTMLDivElement>({ y: 20, stagger: 0.06 });

  if (matches.length === 0) {
    return (
      <p className="u-rule border border-dashed px-6 py-16 text-center text-sm text-ink-muted">
        No matches scheduled today. The season never really stops — check the fixture list.
      </p>
    );
  }

  return (
    <div ref={scope} className="border-t border-ink-line">
      {matches.map((match) => (
        <div key={match.id} className="js-reveal">
          <MatchCard match={match} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  const root = useRef<HTMLElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);

  useParallax(backdrop, 180);

  useLayoutEffect(() => {
    if (!MOTION_OK || !root.current) return;

    const context = gsap.context((self) => {
      const letters = self.selector?.(".js-letter") as HTMLElement[] | undefined;
      const rest = self.selector?.(".js-hero") as HTMLElement[] | undefined;

      const timeline = gsap.timeline({ defaults: { ease: EASE } });

      if (letters?.length) {
        // Letters rise out of a clipped band, like a team sheet being revealed.
        timeline.fromTo(
          letters,
          { yPercent: 115, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1.15, stagger: 0.055 },
        );
      }

      if (rest?.length) {
        timeline.fromTo(
          rest,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 },
          "-=0.6",
        );
      }
    }, root);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-[var(--nav-h)]"
    >
      {/* CSS-only stadium: floodlight bloom, turf horizon, crowd weave, and a
          band of halftone stippling behind the wordmark - the ambient print
          texture, kept off the type itself so it never fights legibility. */}
      <div ref={backdrop} className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_0%,rgba(204,85,0,0.30),transparent_62%)]" />
        <div className="absolute inset-x-0 bottom-[20%] h-72 u-halftone-band opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(to_top,rgba(29,59,40,0.55),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ember/50 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_35%,rgba(10,10,10,0.85))]" />
      </div>

      <div className="u-frame">
        {/* The one stamped-ribbon moment: text sits on a solid, skewed ember
            slab rather than floating orange text on the backdrop. */}
        <p className="js-hero u-slab u-eyebrow mb-8 inline-block text-ink">
          Football&apos;s major leagues · live
        </p>

        <h1
          className="u-display text-4xl sm:text-6xl md:text-hero text-ink-bright"
          aria-label="Esquinazo"
        >
          <span className="flex flex-wrap overflow-hidden pb-[0.08em]" aria-hidden="true">
            {"ESQUINAZO".split("").map((letter, index) => (
              <span key={index} className="js-letter inline-block">
                {letter}
              </span>
            ))}
          </span>
        </h1>

        <div className="mt-8 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <p className="js-hero max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
            Scores, tables, squads. No ads, no logins, no nonsense — just what happened and who&apos;s
            next.
          </p>

          <div className="js-hero flex flex-col gap-3 sm:flex-row">
            <Link
              to="/fixtures"
              className="u-display w-full bg-ember px-6 py-3 text-center text-xs text-ink transition-all
                         duration-300 ease-out hover:bg-ember-bright hover:shadow-ember sm:w-auto"
            >
              Today&apos;s matches
            </Link>
            <Link
              to="/standings"
              className="u-display w-full border border-ink-line px-6 py-3 text-center text-xs text-ink-bright
                         transition-colors duration-300 hover:border-ember hover:text-ember sm:w-auto"
            >
              Tables
            </Link>
          </div>
        </div>
      </div>

      <ScrollCue />
    </section>
  );
}

function ScrollCue() {
  return (
    <div
      className="js-hero pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block"
      aria-hidden="true"
    >
      <span className="u-eyebrow block text-[0.5625rem] text-ink-muted">Scroll</span>
      <span className="mx-auto mt-2 block h-8 w-px overflow-hidden bg-ink-line">
        <span className="block h-full w-full origin-top animate-[ticker_2.4s_ease-in-out_infinite] bg-ember" />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Counters({ matchCount }: { matchCount: number }) {
  const scope = useReveal<HTMLElement>({ y: 24 });

  return (
    <section ref={scope} className="u-frame u-tear py-14 sm:py-20">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
        <Counter label="Matches tracked" value={Math.max(matchCount, 380)} suffix="+" />
        <Counter label="Leagues" value={8} />
        <Counter label="Players indexed" value={4200} suffix="+" />
        <Counter label="Refresh interval" value={5} suffix=" min" />
      </dl>
    </section>
  );
}

function Counter({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useCounter(ref, value);

  return (
    <div className="js-reveal">
      <dd className="u-display tnum text-display text-ink-bright">
        <span ref={ref}>0</span>
        <span className="text-ember-bright">{suffix}</span>
      </dd>
      <dt className="u-eyebrow mt-3">{label}</dt>
    </div>
  );
}
