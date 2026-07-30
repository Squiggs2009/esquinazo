/**
 * Shimmer placeholders. These mirror the shape of the real content they stand
 * in for, so the layout does not jump when data lands - the point of a skeleton
 * over a spinner.
 */

export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative block overflow-hidden rounded bg-ink-raised ${className}`}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r
                   from-transparent via-white/[0.055] to-transparent"
      />
    </span>
  );
}

/** Matches the geometry of MatchCard. */
export function MatchCardSkeleton() {
  return (
    <div className="u-rule flex items-center gap-4 border-b px-4 py-5 sm:px-6">
      <Shimmer className="h-4 w-11 shrink-0" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-3">
          <Shimmer className="h-8 w-8 rounded-full" />
          <Shimmer className="h-3.5 w-32 max-w-[38vw]" />
        </div>
        <div className="flex items-center gap-3">
          <Shimmer className="h-8 w-8 rounded-full" />
          <Shimmer className="h-3.5 w-24 max-w-[30vw]" />
        </div>
      </div>
      <Shimmer className="h-9 w-12 shrink-0" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="u-rule flex items-center gap-3 border-b px-4 py-3.5">
      <Shimmer className="h-3.5 w-4 shrink-0" />
      <Shimmer className="h-8 w-8 shrink-0 rounded-full" />
      <Shimmer className="h-3.5 flex-1 max-w-[10rem]" />
      <Shimmer className="hidden h-3.5 w-8 sm:block" />
      <Shimmer className="h-3.5 w-8" />
    </div>
  );
}

export function PlayerCardSkeleton() {
  return (
    <div className="u-rule border p-5">
      <div className="flex items-center gap-3.5">
        <Shimmer className="h-11 w-11 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Shimmer className="h-3.5 w-28" />
          <Shimmer className="h-2.5 w-16" />
        </div>
      </div>
      <Shimmer className="mt-5 h-2.5 w-20" />
    </div>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="u-rule border">
      <Shimmer className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Shimmer className="h-2.5 w-24" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonList({
  count,
  children,
}: {
  count: number;
  children: (index: number) => React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{children(i)}</div>
      ))}
    </div>
  );
}
