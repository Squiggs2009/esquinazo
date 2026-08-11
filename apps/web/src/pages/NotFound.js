import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useTitle } from "@/components/PageShell";
import { useT } from "@/context/LanguageContext";
export default function NotFound() {
    const t = useT();
    useTitle(t("notFound.title"));
    return (_jsxs("div", { className: "u-frame flex min-h-[70svh] flex-col justify-center pb-section pt-[calc(var(--nav-h)+4rem)]", children: [_jsx("p", { className: "u-eyebrow text-ember", children: t("notFound.badge") }), _jsx("h1", { className: "u-display mt-4 text-display text-ink-bright", children: t("notFound.headline") }), _jsx("p", { className: "mt-4 max-w-md text-sm leading-relaxed text-ink-muted", children: t("notFound.detail") }), _jsxs("div", { className: "mt-9 flex flex-wrap gap-3", children: [_jsx(Link, { to: "/", className: "u-display bg-ember px-6 py-3 text-xs text-ink transition-all duration-300\n                     ease-out hover:bg-ember-bright hover:shadow-ember", children: t("nav.home") }), _jsx(Link, { to: "/fixtures", className: "u-display border border-ink-line px-6 py-3 text-xs text-ink-bright\n                     transition-colors duration-300 hover:border-ember hover:text-ember", children: t("nav.fixtures") })] })] }));
}
