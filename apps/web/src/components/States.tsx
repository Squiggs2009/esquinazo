import { ApiError } from "@/lib/api";

/**
 * Failure and empty states. Both explain what happened and what the reader can
 * do next; neither is a shrug.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="u-rule border border-dashed px-6 py-14 text-center sm:py-20">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const api = error instanceof ApiError ? error : null;

  // Upstream provider failures are not the reader's fault and not retryable in
  // any useful sense, so they get different copy from a dropped connection.
  const isUpstream = api !== null && api.status >= 500;
  const isNotFound = api?.status === 404;
  const isRateLimited = api?.status === 429;

  const headline = isNotFound
    ? "Nothing here"
    : isRateLimited
      ? "Too many requests"
      : isUpstream
        ? "The data feed is down"
        : "Could not load";

  const detail = isNotFound
    ? "That record does not exist, or the feed no longer carries it."
    : isRateLimited
      ? "The upstream provider is throttling us. It clears within a minute."
      : isUpstream
        ? "Our provider is not responding. Cached results are shown where we have them."
        : (api?.message ?? "Something went wrong on the way to the server.");

  return (
    <Frame>
      <p className="u-eyebrow text-ember">Error{api?.status ? ` ${api.status}` : ""}</p>
      <h2 className="u-display mt-3 text-title text-ink-bright">{headline}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{detail}</p>
      {onRetry && !isNotFound && (
        <button
          type="button"
          onClick={onRetry}
          className="u-display mt-7 border border-ember px-5 py-2 text-xs uppercase tracking-wider
                     text-ember transition-colors duration-300 hover:bg-ember hover:text-ink"
        >
          Try again
        </button>
      )}
    </Frame>
  );
}

export function EmptyState({
  headline,
  detail,
  action,
}: {
  headline: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <Frame>
      <h2 className="u-display text-title text-ink-bright">{headline}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{detail}</p>
      {action && <div className="mt-7">{action}</div>}
    </Frame>
  );
}
