import { Link } from "react-router-dom";

/**
 * Esquinazo crest. A static asset (public/esquinazo-mark.svg) rather than
 * inlined markup - the artwork carries its own colours and a baked-in
 * wordmark of its own, so unlike the placeholder it replaces there is
 * nothing here for currentColor/CSS to theme.
 */
export function Monogram({ className = "h-8 w-8" }: { className?: string }) {
  return <img src="/esquinazo-mark.svg" alt="" className={`${className} shrink-0 object-contain`} />;
}

export function Wordmark() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-80"
      aria-label="Esquinazo — home"
    >
      <Monogram className="h-8 w-8 shrink-0" />
      <span className="u-display text-base leading-none text-ink-bright">Esquinazo</span>
    </Link>
  );
}
