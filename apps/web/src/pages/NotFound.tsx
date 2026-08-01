import { Link } from "react-router-dom";
import { useTitle } from "@/components/PageShell";
import { useT } from "@/context/LanguageContext";

export default function NotFound() {
  const t = useT();
  useTitle(t("notFound.title"));

  return (
    <div className="u-frame flex min-h-[70svh] flex-col justify-center pb-section pt-[calc(var(--nav-h)+4rem)]">
      <p className="u-eyebrow text-ember">{t("notFound.badge")}</p>
      <h1 className="u-display mt-4 text-display text-ink-bright">{t("notFound.headline")}</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
        {t("notFound.detail")}
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          to="/"
          className="u-display bg-ember px-6 py-3 text-xs text-ink transition-all duration-300
                     ease-out hover:bg-ember-bright hover:shadow-ember"
        >
          {t("nav.home")}
        </Link>
        <Link
          to="/fixtures"
          className="u-display border border-ink-line px-6 py-3 text-xs text-ink-bright
                     transition-colors duration-300 hover:border-ember hover:text-ember"
        >
          {t("nav.fixtures")}
        </Link>
      </div>
    </div>
  );
}
