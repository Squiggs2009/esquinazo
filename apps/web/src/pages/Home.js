import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/images/hero.webp";
import { ScoreTicker } from "@/components/ScoreTicker";
import { Headlines } from "@/components/Headlines";
import { MatchCard } from "@/components/MatchCard";
import { MatchCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { ErrorState } from "@/components/States";
import { useTitle } from "@/components/PageShell";
import { useT } from "@/context/LanguageContext";
import { useTodayFixtures } from "@/lib/queries";
import { EASE, gsap, MOTION_OK, useCounter, useParallax, useReveal } from "@/lib/motion";
import { isLive } from "@/lib/api";
export default function Home() {
    const t = useT();
    useTitle(t("home.title"));
    // Today across every configured league, not one competition's whole season.
    const { data, isPending, isError, error, refetch } = useTodayFixtures();
    const matches = data?.data.fixtures ?? [];
    const live = matches.filter(isLive);
    const ticker = live.length > 0 ? live : matches.slice(0, 12);
    return (_jsxs(_Fragment, { children: [_jsx(Hero, {}), _jsx(ScoreTicker, { matches: ticker }), _jsx(Counters, { matchCount: matches.length }), _jsx(Headlines, {}), _jsxs("section", { className: "u-frame py-section", children: [_jsxs("div", { className: "mb-8 flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("p", { className: "u-eyebrow flex items-center gap-2 text-ember-bright", children: [_jsx("span", { className: "h-2 w-2 shrink-0 bg-ember", "aria-hidden": "true" }), live.length > 0 ? t("home.inPlay") : t("home.nextUp")] }), _jsx("h2", { className: "u-display mt-3 text-title", children: live.length > 0 ? t("home.liveNow") : t("home.todaysFixtures") })] }), _jsx(Link, { to: "/fixtures", className: "u-display text-xs text-ember hover:text-ember-bright", children: t("home.allFixtures") })] }), isPending ? (_jsx(SkeletonList, { count: 5, children: () => _jsx(MatchCardSkeleton, {}) })) : isError ? (_jsx(ErrorState, { error: error, onRetry: () => void refetch() })) : (_jsx(FixtureList, { matches: (live.length > 0 ? live : matches).slice(0, 6) }))] })] }));
}
function FixtureList({ matches }) {
    const scope = useReveal({ y: 20, stagger: 0.06 });
    const t = useT();
    if (matches.length === 0) {
        return (_jsx("p", { className: "u-rule border border-dashed px-6 py-16 text-center text-sm text-ink-muted", children: t("home.noneToday") }));
    }
    return (_jsx("div", { ref: scope, className: "border-t border-ink-line", children: matches.map((match) => (_jsx("div", { className: "js-reveal", children: _jsx(MatchCard, { match: match, showLeague: true }) }, match.fixture.id))) }));
}
/* ------------------------------------------------------------------ */
function Hero() {
    const t = useT();
    const root = useRef(null);
    const backdrop = useRef(null);
    useParallax(backdrop, 180);
    useLayoutEffect(() => {
        if (!MOTION_OK || !root.current)
            return;
        const context = gsap.context((self) => {
            const letters = self.selector?.(".js-letter");
            const rest = self.selector?.(".js-hero");
            const timeline = gsap.timeline({ defaults: { ease: EASE } });
            if (letters?.length) {
                // Letters rise out of a clipped band, like a team sheet being revealed.
                timeline.fromTo(letters, { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.15, stagger: 0.055 });
            }
            if (rest?.length) {
                timeline.fromTo(rest, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, "-=0.6");
            }
        }, root);
        return () => context.revert();
    }, []);
    return (_jsxs("section", { ref: root, className: "relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-[var(--nav-h)]", children: [_jsxs("div", { ref: backdrop, className: "absolute inset-0 -z-10 overflow-hidden", "aria-hidden": "true", children: [_jsx("img", { src: heroImage, alt: "", loading: "eager", fetchPriority: "high", className: "h-full w-full object-cover object-[50%_60%] grayscale" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-ember-dim/80 via-ink/60 to-ink mix-blend-color" }), _jsx("div", { className: "absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_0%,rgba(204,85,0,0.30),transparent_62%)]" }), _jsx("div", { className: "absolute inset-x-0 bottom-[20%] h-72 u-halftone-band opacity-70" }), _jsx("div", { className: "absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(to_top,rgba(29,59,40,0.55),transparent)]" }), _jsx("div", { className: "absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ember/50 to-transparent" }), _jsx("div", { className: "absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_35%,rgba(10,10,10,0.85))]" })] }), _jsxs("div", { className: "u-frame", children: [_jsx("p", { className: "js-hero u-slab u-eyebrow mb-8 inline-block text-ink", children: t("home.eyebrow") }), _jsx("h1", { className: "u-display text-4xl sm:text-6xl md:text-hero text-ink-bright", "aria-label": "Esquinazo", children: _jsx("span", { className: "flex flex-wrap overflow-hidden pb-[0.08em]", "aria-hidden": "true", children: "ESQUINAZO".split("").map((letter, index) => (_jsx("span", { className: "js-letter inline-block", children: letter }, index))) }) }), _jsxs("div", { className: "mt-8 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between", children: [_jsx("p", { className: "js-hero max-w-md text-sm leading-relaxed text-ink-muted sm:text-base", children: t("home.tagline") }), _jsxs("div", { className: "js-hero flex flex-col gap-3 sm:flex-row", children: [_jsx(Link, { to: "/fixtures", className: "u-display w-full bg-ember px-6 py-3 text-center text-xs text-ink transition-all\n                         duration-300 ease-out hover:bg-ember-bright hover:shadow-ember sm:w-auto", children: t("home.ctaMatches") }), _jsx(Link, { to: "/standings", className: "u-display w-full border border-ink-line px-6 py-3 text-center text-xs text-ink-bright\n                         transition-colors duration-300 hover:border-ember hover:text-ember sm:w-auto", children: t("home.ctaTables") })] })] })] }), _jsx(ScrollCue, {})] }));
}
function ScrollCue() {
    const t = useT();
    return (_jsxs("div", { className: "js-hero pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block", "aria-hidden": "true", children: [_jsx("span", { className: "u-eyebrow block text-[0.5625rem] text-ink-muted", children: t("home.scroll") }), _jsx("span", { className: "mx-auto mt-2 block h-8 w-px overflow-hidden bg-ink-line", children: _jsx("span", { className: "block h-full w-full origin-top animate-[ticker_2.4s_ease-in-out_infinite] bg-ember" }) })] }));
}
/* ------------------------------------------------------------------ */
function Counters({ matchCount }) {
    const scope = useReveal({ y: 24 });
    const t = useT();
    return (_jsx("section", { ref: scope, className: "u-frame u-tear py-14 sm:py-20", children: _jsxs("dl", { className: "grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4", children: [_jsx(Counter, { label: t("home.statMatches"), value: Math.max(matchCount, 380), suffix: "+" }), _jsx(Counter, { label: t("home.statLeagues"), value: 10 }), _jsx(Counter, { label: t("home.statPlayers"), value: 4200, suffix: "+" }), _jsx(Counter, { label: t("home.statRefresh"), value: 5, suffix: t("home.statRefreshUnit") })] }) }));
}
function Counter({ label, value, suffix = "" }) {
    const ref = useRef(null);
    useCounter(ref, value);
    return (_jsxs("div", { className: "js-reveal", children: [_jsxs("dd", { className: "u-display tnum text-display text-ink-bright", children: [_jsx("span", { ref: ref, children: "0" }), _jsx("span", { className: "text-ember-bright", children: suffix })] }), _jsx("dt", { className: "u-eyebrow mt-3", children: label })] }));
}
