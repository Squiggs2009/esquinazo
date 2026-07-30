import { Link } from "react-router-dom";

/**
 * "E" monogram drawn as three bars with the middle one short - a corner flag
 * silhouette read sideways, which is what an *esquinazo* is played from.
 */
export function Monogram({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path
        d="M8 6h17v5.2H13.6v4.1h10v5.1h-10v5.4H25V31"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="square"
        className="text-ember"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-80"
      aria-label="Esquinazo — home"
    >
      <Monogram className="h-7 w-7 shrink-0" />
      <span className="u-display text-base leading-none text-ink-bright">Esquinazo</span>
    </Link>
  );
}
