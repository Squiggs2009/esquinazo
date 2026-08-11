import { useCallback, useEffect, useState } from "react";
import { ArticleCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useT } from "@/context/LanguageContext";
import { articleDate } from "@/lib/format";
import { useReveal } from "@/lib/motion";
import {
  ARCHIVE_PAGE_SIZE,
  STATIC_PAGE_SIZE,
  getArchiveEntries,
  wireConfigured,
  type WireListEntry,
} from "@/lib/sanity";

/**
 * The Wire archive - everything older than the ten entries on the static /news
 * page, loaded client-side straight from Sanity.
 *
 * /news itself is not this page: it is pre-rendered HTML written to S3 by the
 * generate-wire-page Lambda so crawlers get real content instead of an empty
 * SPA shell. This route picks up where that page stops, which is why the first
 * request starts at an offset rather than zero.
 *
 * Note every link out of here is a plain <a>, not a react-router <Link>. Entry
 * pages are static files served by CloudFront; a client-side navigation would
 * be intercepted by the router, match no route, and land on the 404.
 */
export default function News() {
  const t = useT();
  useTitle(t("wire.archiveTitle"));

  const [entries, setEntries] = useState<WireListEntry[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);

  const load = useCallback(async (offset: number) => {
    setLoading(true);
    setError(null);
    try {
      const batch = await getArchiveEntries(offset, ARCHIVE_PAGE_SIZE);
      setEntries((current) => (offset === STATIC_PAGE_SIZE ? batch : [...current, ...batch]));
      // A short batch means there is nothing left behind it.
      if (batch.length < ARCHIVE_PAGE_SIZE) setExhausted(true);
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!wireConfigured) {
      setLoading(false);
      return;
    }
    void load(STATIC_PAGE_SIZE);
  }, [load]);

  const showSkeleton = loading && entries.length === 0;

  return (
    <>
      <PageHeader
        eyebrow={t("wire.archiveEyebrow")}
        title={t("wire.archiveTitle")}
        lede={t("wire.archiveLede")}
      />

      <div className="u-frame pb-section">
        <p className="mb-8 text-sm text-ink-muted">
          <a href="/news" className="u-link">
            {t("wire.backToWire")}
          </a>
        </p>

        {showSkeleton ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonList count={6}>{() => <ArticleCardSkeleton />}</SkeletonList>
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => void load(STATIC_PAGE_SIZE)} />
        ) : entries.length === 0 ? (
          <EmptyState headline={t("wire.emptyTitle")} detail={t("wire.emptyDetail")} />
        ) : (
          <>
            <ArchiveGrid entries={entries} />

            {!exhausted && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void load(STATIC_PAGE_SIZE + entries.length)}
                  className="u-display border border-ember px-6 py-2.5 text-xs uppercase tracking-wider
                             text-ember transition-colors duration-300 hover:bg-ember hover:text-ink
                             disabled:opacity-50"
                >
                  {loading ? t("wire.loading") : t("wire.loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function ArchiveGrid({ entries }: { entries: WireListEntry[] }) {
  // Re-keyed on length so a "load more" batch animates in rather than
  // appearing at the opacity:0 the reveal leaves untouched nodes at.
  const scope = useReveal<HTMLDivElement>({ y: 26, stagger: 0.05 });

  return (
    <div
      key={entries.length}
      ref={scope}
      className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
    >
      {entries.map((entry) => (
        <ArchiveCard key={entry._id} entry={entry} />
      ))}
    </div>
  );
}

function ArchiveCard({ entry }: { entry: WireListEntry }) {
  const t = useT();
  const kind = entry.contentType === "opinion" ? t("wire.opinion") : t("wire.news");

  return (
    <article className="js-reveal">
      <a
        href={`/news/${entry.slug}`}
        className="group flex h-full flex-col border border-ink-line p-5 transition-all duration-500
                   ease-out hover:-translate-y-1 hover:border-ember/40 hover:shadow-ember"
      >
        <p className="u-eyebrow text-ember">
          {kind} · {articleDate(entry.publishedAt)}
        </p>

        <h2
          className="u-display mt-3 break-words text-base leading-snug text-ink-bright
                     transition-colors duration-300 group-hover:text-ember"
        >
          {entry.headline}
        </h2>

        {entry.sourceLabel && (
          <p className="mt-auto pt-4 text-xs text-ink-muted">{entry.sourceLabel}</p>
        )}
      </a>
    </article>
  );
}
