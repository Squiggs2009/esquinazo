import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense, useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageShell";
import { MatchCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { LanguageProvider, useT } from "@/context/LanguageContext";
import Home from "@/pages/Home";
// The landing page ships in the main bundle; the rest split out, so a first
// visit downloads the hero and nothing else.
const Fixtures = lazy(() => import("@/pages/Fixtures"));
const MatchDetail = lazy(() => import("@/pages/MatchDetail"));
const Standings = lazy(() => import("@/pages/Standings"));
const Players = lazy(() => import("@/pages/Players"));
const Nations = lazy(() => import("@/pages/Nations"));
const News = lazy(() => import("@/pages/News"));
const NotFound = lazy(() => import("@/pages/NotFound"));
export default function App() {
    return (_jsx(LanguageProvider, { children: _jsx(Shell, {}) }));
}
/**
 * Split from App so it sits *inside* the provider - useT would throw if it ran
 * in the same component that renders LanguageProvider.
 */
function Shell() {
    const t = useT();
    usePageviews();
    return (_jsxs("div", { className: "flex min-h-screen flex-col", children: [_jsx("a", { href: "#main", className: "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]\n                   focus:bg-ember focus:px-4 focus:py-2 focus:text-sm focus:text-ink", children: t("nav.skip") }), _jsx(Nav, {}), _jsx("main", { id: "main", className: "flex-1", children: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(PageTransition, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/fixtures", element: _jsx(Fixtures, {}) }), _jsx(Route, { path: "/match/:id", element: _jsx(MatchDetail, {}) }), _jsx(Route, { path: "/standings", element: _jsx(Standings, {}) }), _jsx(Route, { path: "/players", element: _jsx(Players, {}) }), _jsx(Route, { path: "/nations", element: _jsx(Nations, {}) }), _jsx(Route, { path: "/news", element: _jsx(News, {}) }), _jsx(Route, { path: "/news/archive", element: _jsx(News, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) })] }) }) }) }), _jsx(Footer, {})] }));
}
const GA_MEASUREMENT_ID = "G-7446RP1F2N";
/**
 * Reports client-side navigations to GA4. The gtag.js snippet in index.html
 * sends the pageview for whatever URL the browser loaded, so this skips its
 * first run - otherwise the landing route would be counted twice.
 */
function usePageviews() {
    const { pathname } = useLocation();
    // Seeded with the entry URL, which the snippet has already reported. Holding
    // the path rather than a "first run" flag also keeps StrictMode's double
    // effect invocation in dev from sending a duplicate.
    const reported = useRef(pathname);
    useEffect(() => {
        if (reported.current === pathname)
            return;
        reported.current = pathname;
        window.gtag?.("config", GA_MEASUREMENT_ID, { page_path: pathname });
    }, [pathname]);
}
/** Shown only while a route chunk downloads — same shimmer language as data loads. */
function RouteFallback() {
    return (_jsx("div", { className: "u-frame pb-section pt-[calc(var(--nav-h)+4rem)]", children: _jsx(SkeletonList, { count: 6, children: () => _jsx(MatchCardSkeleton, {}) }) }));
}
