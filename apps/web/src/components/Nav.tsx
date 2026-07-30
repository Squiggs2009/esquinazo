import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Wordmark } from "./Brand";
import { KOFI_URL } from "@/lib/links";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/fixtures", label: "Fixtures" },
  { to: "/standings", label: "Standings" },
  { to: "/players", label: "Players" },
  { to: "/news", label: "News" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close the drawer on navigation, otherwise it hangs over the new page.
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the open drawer.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-out
                  ${scrolled || open ? "border-b border-ink-line bg-ink/92 backdrop-blur-md" : "border-b border-transparent"}`}
    >
      <div className="u-frame flex h-[var(--nav-h)] items-center justify-between gap-6">
        <Wordmark />

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7 lg:gap-9">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `u-display relative text-xs transition-colors duration-300
                     ${isActive ? "text-ink-bright" : "text-ink-muted hover:text-ink-bright"}
                     after:absolute after:-bottom-2 after:left-0 after:h-px after:bg-ember
                     after:transition-all after:duration-300 after:ease-out
                     ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="u-btn-donate hidden sm:inline-flex"
          >
            <HeartIcon />
            Donate
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-10 w-10 place-items-center md:hidden"
          >
            <span className="relative block h-3.5 w-6">
              <span
                className={`absolute left-0 block h-0.5 w-full bg-ink-bright transition-all duration-300 ease-out
                            ${open ? "top-1.5 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-full bg-ink-bright transition-opacity duration-200
                            ${open ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-full bg-ink-bright transition-all duration-300 ease-out
                            ${open ? "top-1.5 -rotate-45" : "top-3"}`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer: full-height panel, links at display size. */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="u-frame flex h-[calc(100dvh-var(--nav-h))] flex-col justify-between
                   border-t border-ink-line bg-ink pb-10 pt-8 md:hidden"
      >
        <ul className="flex flex-col gap-1">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `u-display block border-b border-ink-line py-4 text-2xl
                   ${isActive ? "text-ember" : "text-ink-bright"}`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="u-btn-donate justify-center py-3.5"
        >
          <HeartIcon />
          Support Esquinazo
        </a>
      </div>
    </header>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M8 14.5S1 10.2 1 5.6A3.6 3.6 0 0 1 8 4.2a3.6 3.6 0 0 1 7 1.4c0 4.6-7 8.9-7 8.9Z" />
    </svg>
  );
}
