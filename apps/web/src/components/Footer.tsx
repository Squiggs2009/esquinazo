import { Link } from "react-router-dom";
import { Monogram } from "./Brand";
import { DATA_PROVIDER, KOFI_URL, SPONSOR } from "@/lib/links";

const COLUMNS = [
  {
    heading: "Matches",
    links: [
      { to: "/fixtures", label: "Fixtures" },
      { to: "/standings", label: "Standings" },
    ],
  },
  {
    heading: "People",
    links: [
      { to: "/players", label: "Players" },
      { to: "/news", label: "News" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-section border-t border-ink-line">
      <div className="u-frame py-14">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(2,minmax(0,0.7fr))_1.2fr]">
          <div>
            <Monogram className="h-9 w-9" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
              Live scores, tables and squads across Europe&apos;s major leagues. No accounts, no
              tracking, no interstitials.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="u-eyebrow mb-4">{column.heading}</p>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="u-link text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="u-eyebrow mb-4">Keep it running</p>
            <p className="mb-5 text-sm leading-relaxed text-ink-muted">
              Esquinazo is free and ad-free. Hosting is not.
            </p>
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn-donate"
            >
              Buy a coffee
            </a>
          </div>
        </div>

        <div
          className="mt-14 flex flex-col gap-4 border-t border-ink-line pt-7
                     sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs text-ink-muted">
            Powered by{" "}
            <a
              href={SPONSOR.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ember transition-colors duration-300 hover:text-ember-bright"
            >
              {SPONSOR.name}
            </a>
          </p>

          <p className="text-xs text-ink-muted">
            Match data from{" "}
            <a
              href={DATA_PROVIDER.url}
              target="_blank"
              rel="noopener noreferrer"
              className="u-link"
            >
              {DATA_PROVIDER.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
