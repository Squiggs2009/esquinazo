import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Monogram } from "./Brand";
import { useT } from "@/context/LanguageContext";
import { DATA_PROVIDER, KOFI_URL, SPONSOR } from "@/lib/links";
const COLUMNS = [
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
    return (_jsxs("footer", { className: "mt-section", children: [_jsx("div", { className: "border-t-2 border-ink-line", "aria-hidden": "true" }), _jsx("div", { className: "mt-1 border-t border-ink-line/60", "aria-hidden": "true" }), _jsxs("div", { className: "u-frame py-14", children: [_jsxs("div", { className: "grid gap-12 md:grid-cols-[1.4fr_repeat(2,minmax(0,0.7fr))_1.2fr]", children: [_jsxs("div", { children: [_jsx(Monogram, { className: "h-12 w-12" }), _jsx("p", { className: "mt-5 max-w-xs text-sm leading-relaxed text-ink-muted", children: t("footer.blurb") })] }), COLUMNS.map((column) => (_jsxs("nav", { "aria-label": t(column.heading), children: [_jsx("p", { className: "u-eyebrow mb-4", children: t(column.heading) }), _jsx("ul", { className: "flex flex-col gap-2.5", children: column.links.map((link) => (_jsx("li", { children: _jsx(Link, { to: link.to, className: "u-link text-sm", children: t(link.label) }) }, link.to))) })] }, column.heading))), _jsxs("div", { children: [_jsx("p", { className: "u-eyebrow mb-4", children: t("footer.keepRunning") }), _jsx("p", { className: "mb-5 text-sm leading-relaxed text-ink-muted", children: t("footer.keepRunningBlurb") }), _jsx("a", { href: KOFI_URL, target: "_blank", rel: "noopener noreferrer", className: "u-btn-donate", children: t("footer.buyCoffee") })] })] }), _jsxs("div", { className: "mt-14 flex flex-col gap-4 border-t border-ink-line pt-7\n                     sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("p", { className: "text-xs text-ink-muted", children: [t("footer.poweredBy"), " ", _jsx("a", { href: SPONSOR.url, target: "_blank", rel: "noopener noreferrer", className: "font-semibold text-ember-bright transition-colors duration-300 hover:text-ink-bright", children: SPONSOR.name })] }), _jsxs("p", { className: "text-xs text-ink-muted", children: [t("footer.dataFrom"), " ", _jsx("a", { href: DATA_PROVIDER.url, target: "_blank", rel: "noopener noreferrer", className: "u-link", children: DATA_PROVIDER.name })] })] })] })] }));
}
