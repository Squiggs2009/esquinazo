import { Link } from "react-router-dom";
import { useTitle } from "@/components/PageShell";

export default function NotFound() {
  useTitle("Page not found");

  return (
    <div className="u-frame flex min-h-[70svh] flex-col justify-center pb-section pt-[calc(var(--nav-h)+4rem)]">
      <p className="u-eyebrow text-ember">Error 404</p>
      <h1 className="u-display mt-4 text-display text-ink-bright">Off the pitch</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
        That page does not exist. The scores, however, do.
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          to="/"
          className="u-display bg-ember px-6 py-3 text-xs text-ink transition-all duration-300
                     ease-out hover:bg-ember-bright hover:shadow-ember"
        >
          Home
        </Link>
        <Link
          to="/fixtures"
          className="u-display border border-ink-line px-6 py-3 text-xs text-ink-bright
                     transition-colors duration-300 hover:border-ember hover:text-ember"
        >
          Fixtures
        </Link>
      </div>
    </div>
  );
}
