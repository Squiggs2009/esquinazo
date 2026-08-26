import { useEffect, useState } from "react";
import { articleDate } from "@/lib/format";
import { useReveal } from "@/lib/motion";
import { useT } from "@/context/LanguageContext";
import {
  getLatestWireEntries,
  wireConfigured,
  wireEntryThumbnailUrl,
  type WireListEntry,
} from "@/lib/sanity";

/** How many Wire entries the homepage module shows. */
const HOME_NEWS_COUNT = 4;

/**
 * Homepage teaser for the Wire's most recent entries - replaces the old
 * NewsAPI-backed "Around the leagues" section.
 *
 * Mirrors News.tsx's fetch pattern deliberately: a plain fetch against
 * Sanity's public dataset, not the @tanstack/react-query hooks in
 * lib/queries.ts, which are for the API-Football-backed resources. Same
 * reasoning as sanity.ts's own header comment - one query on the highest-
 * traffic page isn't worth pulling react-query's cache machinery in for.
 *
 * Like the section it replaces, this renders nothing while loading, on
 * error, or when nothing is published yet - a missing or momentarily
 * unavailable Wire entry should never leave an apology sitting on the
 * homepage. It lights up on its own once there is something to show.
 */
export function EsquinazoNews() {
  const [entries, setEntries] = useState<WireListEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!wireConfigured) return;
    let cancelled = false;

    getLatestWireEntries(HOME_NEWS_COUNT)
      .then((result) => {
        if (!cancelled) setEntries(result);
      })
      .catch(() => {
        // Silent - see the doc comment above.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || entries.length === 0) return null;
  return <NewsSection entries={entries} />;
}

/**
 * A separate component, not an inline branch of EsquinazoNews: useReveal's
 * ScrollTrigger attaches to whatever DOM node exists on this component's
 * first render, so toggling one instance between null and real content would
 * leave the ref unset on mount and the animation would never arm.
 */
function NewsSection({ entries }: { entries: WireListEntry[] }) {
  // Tighter than useReveal's 0.08 default: with a header plus up to
  // HOME_NEWS_COUNT cards there can be 7 .js-reveal targets in this section,
  // and 0.08 stretches the cascade noticeably. Matches ArchiveGrid's 0.05 in
  // News.tsx, which reveals multi-card grids of the same size.
  const scope = useReveal<HTMLElement>({ y: 20, stagger: 0.05 });
  const t = useT();

  return (
    <section ref={scope} className="u-frame border-b border-ink-line py-14 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="js-reveal u-eyebrow text-ember">{t("home.newsEyebrow")}</p>
          <h2 className="js-reveal u-display mt-3 text-title">{t("home.newsTitle")}</h2>
        </div>
        {/* Plain <a>, not <Link>: /news is a static file served straight from
            S3/CloudFront, not a client-side route. */}
        <a href="/news" className="js-reveal u-display text-xs text-ember hover:text-ember-bright">
          {t("home.newsLink")}
        </a>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {entries.map((entry) => (
          <NewsCard key={entry._id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function NewsCard({ entry }: { entry: WireListEntry }) {
  const t = useT();
  const kind = entry.contentType === "opinion" ? t("wire.opinion") : t("wire.news");
  const thumb = wireEntryThumbnailUrl(entry.heroImage, 192);

  return (
    <a
      href={`/news/${entry.slug}`}
      className="js-reveal group flex items-center gap-5 border border-ink-line p-5
                 transition-all duration-500 ease-out hover:-translate-y-1
                 hover:border-ember/40 hover:shadow-ember"
    >
      {thumb && (
        // alt="" is deliberate: this image sits inside the same link as the
        // headline it illustrates, so the link's accessible name already
        // covers it - a screen reader describing it too would just repeat
        // the heading that follows.
        <img
          src={thumb}
          alt=""
          width={96}
          height={96}
          loading="lazy"
          className="h-20 w-20 shrink-0 bg-ink-raised object-cover sm:h-24 sm:w-24"
        />
      )}
      <div className="min-w-0">
        <p className="u-eyebrow text-ember">
          {kind} · {articleDate(entry.publishedAt)}
        </p>
        <h3
          className="u-display mt-2 break-words text-lg leading-snug text-ink-bright
                     transition-colors duration-300 group-hover:text-ember sm:text-title"
        >
          {entry.headline}
        </h3>
      </div>
    </a>
  );
}
