import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Wordmark } from "./Brand";
import { LanguageToggle } from "./LanguageToggle";
import { useT } from "@/context/LanguageContext";
import { KOFI_URL } from "@/lib/links";
/**
 * `external` forces a real navigation instead of a client-side one. /news is a
 * static page written to S3, so a react-router <Link> would render the SPA's
 * archive route and the pre-rendered Wire would never be seen by anyone
 * browsing the site.
 */
const LINKS = [
    { to: "/", label: "nav.home", end: true },
    { to: "/fixtures", label: "nav.fixtures" },
    { to: "/standings", label: "nav.standings" },
    { to: "/players", label: "nav.players" },
    { to: "/nations", label: "nav.nations" },
    { to: "/news", label: "nav.news", external: true },
];
export function Nav() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const t = useT();
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
    return (_jsxs("header", { className: `fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-out
                  ${scrolled || open ? "border-b-2 border-ink-line bg-ink/[0.92] backdrop-blur-md" : "border-b-2 border-transparent"}`, children: [_jsxs("div", { className: "u-frame flex h-[var(--nav-h)] items-center justify-between gap-4 sm:gap-6", children: [_jsx(Wordmark, {}), _jsx("nav", { "aria-label": t("nav.primary"), className: "hidden md:block", children: _jsx("ul", { className: "flex items-center gap-6 lg:gap-8", children: LINKS.map((link) => {
                                const desktopClass = (isActive) => `u-display relative text-xs transition-colors duration-300
                 ${isActive ? "text-ink-bright" : "text-ink-muted hover:text-ink-bright"}
                 after:absolute after:-bottom-2 after:left-0 after:h-px after:bg-ember
                 after:transition-all after:duration-300 after:ease-out
                 ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"}`;
                                return (_jsx("li", { children: link.external ? (_jsx("a", { href: link.to, className: desktopClass(false), children: t(link.label) })) : (_jsx(NavLink, { to: link.to, end: link.end, className: ({ isActive }) => desktopClass(isActive), children: t(link.label) })) }, link.to));
                            }) }) }), _jsxs("div", { className: "flex items-center gap-2 sm:gap-3", children: [_jsx(LanguageToggle, {}), _jsxs("a", { href: KOFI_URL, target: "_blank", rel: "noopener noreferrer", className: "u-btn-donate hidden sm:inline-flex", children: [_jsx(HeartIcon, {}), t("nav.donate")] }), _jsx("button", { type: "button", onClick: () => setOpen((v) => !v), "aria-expanded": open, "aria-controls": "mobile-menu", "aria-label": open ? t("nav.closeMenu") : t("nav.openMenu"), className: "grid h-10 w-10 shrink-0 place-items-center md:hidden", children: _jsxs("span", { className: "relative block h-3.5 w-6", children: [_jsx("span", { className: `absolute left-0 block h-0.5 w-full bg-ink-bright transition-all duration-300 ease-out
                            ${open ? "top-1.5 rotate-45" : "top-0"}` }), _jsx("span", { className: `absolute left-0 top-1.5 block h-0.5 w-full bg-ink-bright transition-opacity duration-200
                            ${open ? "opacity-0" : "opacity-100"}` }), _jsx("span", { className: `absolute left-0 block h-0.5 w-full bg-ink-bright transition-all duration-300 ease-out
                            ${open ? "top-1.5 -rotate-45" : "top-3"}` })] }) })] })] }), _jsxs("div", { id: "mobile-menu", className: `u-frame flex h-[calc(100dvh-var(--nav-h))] flex-col justify-between
              overflow-y-auto border-t border-ink-line bg-ink pb-10 pt-8 md:hidden
              ${!open ? "hidden" : ""}`, children: [_jsx("ul", { className: "flex flex-col gap-1", children: LINKS.map((link) => {
                            const drawerClass = (isActive) => `u-display block border-b border-ink-line py-4 text-2xl
               ${isActive ? "text-ember" : "text-ink-bright"}`;
                            return (_jsx("li", { children: link.external ? (_jsx("a", { href: link.to, className: drawerClass(false), children: t(link.label) })) : (_jsx(NavLink, { to: link.to, end: link.end, className: ({ isActive }) => drawerClass(isActive), children: t(link.label) })) }, link.to));
                        }) }), _jsxs("a", { href: KOFI_URL, target: "_blank", rel: "noopener noreferrer", className: "u-btn-donate justify-center py-3.5", children: [_jsx(HeartIcon, {}), t("nav.support")] })] })] }));
}
function HeartIcon() {
    return (_jsx("svg", { viewBox: "0 0 16 16", className: "h-3.5 w-3.5", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M8 14.5S1 10.2 1 5.6A3.6 3.6 0 0 1 8 4.2a3.6 3.6 0 0 1 7 1.4c0 4.6-7 8.9-7 8.9Z" }) }));
}
