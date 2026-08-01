import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
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
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  );
}

/**
 * Split from App so it sits *inside* the provider - useT would throw if it ran
 * in the same component that renders LanguageProvider.
 */
function Shell() {
  const t = useT();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]
                   focus:bg-ember focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        {t("nav.skip")}
      </a>

      <Nav />

      <main id="main" className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/match/:id" element={<MatchDetail />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/players" element={<Players />} />
              <Route path="/nations" element={<Nations />} />
              <Route path="/news" element={<News />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

/** Shown only while a route chunk downloads — same shimmer language as data loads. */
function RouteFallback() {
  return (
    <div className="u-frame pb-section pt-[calc(var(--nav-h)+4rem)]">
      <SkeletonList count={6}>{() => <MatchCardSkeleton />}</SkeletonList>
    </div>
  );
}
