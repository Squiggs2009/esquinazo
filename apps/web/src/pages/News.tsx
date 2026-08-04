import { useState } from "react";
import { ArticleCardSkeleton, SkeletonList } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader, useTitle } from "@/components/PageShell";
import { useT } from "@/context/LanguageContext";
import { useNews } from "@/lib/queries";
import { articleDate } from "@/lib/format";
import { useReveal } from "@/lib/motion";
import type { NewsArticle } from "@/lib/api";
import { ApiError } from "@/lib/api";

/**
 * The API has no /news endpoint yet. The page is wired to one so it lights up
 * the moment it ships; until then a 404 is treated as "not published" rather
 * than an error, because nothing is broken.
 */
export default function News() {
  const t = useT();
  useTitle(t("news.title"));

  const { data, isPending, isError, error, refetch } = useNews();
  const articles = data?.data.articles ?? [];
  const notPublishedYet = error instanceof ApiError && error.status === 404;

  return (
    <>
      <PageHeader
        eyebrow={t("news.eyebrow")}
        title={t("news.title")}
        lede={t("news.lede")}
      />

      <div className="u-frame pb-section">
        {isPending ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonList count={6}>{() => <ArticleCardSkeleton />}</SkeletonList>
          </div>
        ) : notPublishedYet ? (
          <EmptyState
            headline={t("news.notWiredTitle")}
            detail={t("news.notWiredDetail")}
          />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : articles.length === 0 ? (
          <EmptyState
            headline={t("news.emptyTitle")}
            detail={t("news.emptyDetail")}
          />
        ) : (
          <ArticleGrid articles={articles} />
        )}
      </div>
    </>
  );
}

function ArticleGrid({ articles }: { articles: NewsArticle[] }) {
  const scope = useReveal<HTMLDivElement>({ y: 26, stagger: 0.07 });
  const [lead, ...rest] = articles;

  return (
    <div ref={scope} className="flex flex-col gap-10">
      {/* The first story runs wide — an editorial page should not be a uniform grid. */}
      {lead && <ArticleCard article={lead} featured />}

      {rest.length > 0 && (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article, featured = false }: { article: NewsArticle; featured?: boolean }) {
  const Wrapper = article.url ? "a" : "div";

  return (
    <article className="js-reveal">
      <Wrapper
        {...(article.url
          ? { href: article.url, target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className={`group block h-full border border-ink-line transition-all duration-500 ease-out
                    hover:-translate-y-1 hover:border-ember/40 hover:shadow-ember
                    ${featured ? "sm:grid sm:grid-cols-2" : ""}`}
      >
        <ArticleMedia article={article} featured={featured} />

        <div className={`flex flex-col p-5 ${featured ? "justify-center sm:p-9" : ""}`}>
          <p className="u-eyebrow text-ember">
            {article.source ?? "Esquinazo"} · {articleDate(article.publishedAt)}
          </p>

          <h2
            className={`u-display mt-3 break-words text-ink-bright transition-colors duration-300
                        group-hover:text-ember ${featured ? "text-title" : "text-base leading-snug"}`}
          >
            {article.title}
          </h2>

          {article.summary && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">
              {article.summary}
            </p>
          )}
        </div>
      </Wrapper>
    </article>
  );
}

/**
 * NewsAPI's `urlToImage` is frequently null and occasionally a dead link, so
 * the branded wash is the fallback for both cases - not a broken-image icon -
 * following the same onError-swap pattern PlayerAvatar and TeamBadge use.
 */
function ArticleMedia({ article, featured }: { article: NewsArticle; featured: boolean }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(article.imageUrl) && !failed;

  return (
    <div
      className={`relative overflow-hidden bg-ink-raised ${featured ? "aspect-[16/10] sm:aspect-auto" : "aspect-[16/10]"}`}
      aria-hidden="true"
    >
      {showPhoto ? (
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(204,85,0,0.22),transparent_55%)]" />
          <div className="absolute inset-0 bg-stands opacity-60" />
          <span className="u-display absolute bottom-4 left-4 text-4xl text-ink-line">E</span>
        </>
      )}
    </div>
  );
}
