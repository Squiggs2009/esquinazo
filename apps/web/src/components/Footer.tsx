import { Link } from "react-router-dom";
import { Monogram } from "./Brand";
import { useT } from "@/context/LanguageContext";
import { DATA_PROVIDER, KOFI_URL, SPONSOR } from "@/lib/links";
import type { TranslationKey } from "@/lib/i18n";

const COLUMNS: Array<{
  heading: TranslationKey;
  links: Array<{ to: string; label: TranslationKey }>;
}> = [
  {
    heading: "footer.matches",
    links: [
      { to: "/fixtures", label: "nav.fixtures" },
      { to: "/standings", label: "nav.standings" },
    ],
  },
  {
    heading: "footer.people",
    links: [
      { to: "/players", label: "nav.players" },
      { to: "/nations", label: "nav.nations" },
      { to: "/news", label: "nav.news" },
    ],
  },
];

export function Footer() {
  const t = useT();

  return (
    <footer className="mt-section">
      {/* Printed-programme double rule: a heavy line with a fainter echo
          below it, rather than a single hairline. */}
      <div className="border-t-2 border-ink-line" aria-hidden="true" />
      <div className="mt-1 border-t border-ink-line/60" aria-hidden="true" />

      <div className="u-frame py-14">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(2,minmax(0,0.7fr))_1.2fr]">
          <div>
            <Monogram className="h-12 w-12" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
              {t("footer.blurb")}
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={t(column.heading)}>
              <p className="u-eyebrow mb-4">{t(column.heading)}</p>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="u-link text-sm">
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="u-eyebrow mb-4">{t("footer.keepRunning")}</p>
            <p className="mb-5 text-sm leading-relaxed text-ink-muted">
              {t("footer.keepRunningBlurb")}
            </p>
            <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" className="u-btn-donate">
              {t("footer.buyCoffee")}
            </a>
          </div>
        </div>

        <div
          className="mt-14 flex flex-col gap-4 border-t border-ink-line pt-7
                     sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs text-ink-muted">
            {t("footer.poweredBy")}{" "}
            <a
              href={SPONSOR.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ember-bright transition-colors duration-300 hover:text-ink-bright"
            >
              {SPONSOR.name}
            </a>
          </p>

          <p className="text-xs text-ink-muted">
            {t("footer.dataFrom")}{" "}
            <a href={DATA_PROVIDER.url} target="_blank" rel="noopener noreferrer" className="u-link">
              {DATA_PROVIDER.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
