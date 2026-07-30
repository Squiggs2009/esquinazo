import { LEAGUES } from "@/lib/api";

/**
 * League filter. A vertical rail on desktop; on mobile it becomes a horizontal
 * scroller rather than being hidden or collapsed into a select - switching
 * league is the primary action on these pages.
 */
export function LeagueRail({
  value,
  onChange,
  label = "League",
}: {
  value: string;
  onChange: (code: string) => void;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
      <p className="u-eyebrow mb-4 hidden lg:block">{label}</p>

      <ul
        className="-mx-gutter flex gap-1.5 overflow-x-auto px-gutter pb-2
                   lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {LEAGUES.map((league) => {
          const active = league.code === value;

          return (
            <li key={league.code} className="shrink-0 lg:w-full">
              <button
                type="button"
                onClick={() => onChange(league.code)}
                aria-current={active ? "true" : undefined}
                className={`group flex w-full items-baseline gap-2.5 whitespace-nowrap
                            border-ink-line px-3.5 py-2.5 text-left transition-colors duration-300
                            lg:border-l-2 lg:px-4
                            ${
                              active
                                ? "bg-ember/10 text-ink-bright lg:border-l-ember lg:bg-transparent"
                                : "text-ink-muted hover:text-ink-bright lg:hover:border-l-ink-muted"
                            }`}
              >
                <span className="u-display text-xs">{league.code}</span>
                <span className="text-sm">{league.name}</span>
                <span className="ml-auto hidden text-[0.6875rem] text-ink-muted lg:inline">
                  {league.country}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
