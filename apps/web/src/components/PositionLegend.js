import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useT } from "@/context/LanguageContext";
import { POSITION_ORDER } from "@/lib/i18n";
/**
 * Explains the four squad categories the data provider actually reports.
 *
 * Collapsed by default: it is reference material, not something a returning
 * visitor needs re-read every visit. Rendered as a real button controlling a
 * plain block rather than a <details> element, so the open state can drive the
 * same chevron rotation the rest of the site uses.
 */
export function PositionLegend() {
    const [open, setOpen] = useState(false);
    const t = useT();
    return (_jsxs("section", { className: "mb-8 border border-ink-line", children: [_jsx("h2", { children: _jsxs("button", { type: "button", onClick: () => setOpen((v) => !v), "aria-expanded": open, "aria-controls": "position-legend", className: "flex w-full items-center justify-between gap-4 px-4 py-3 text-left\n                     transition-colors duration-300 hover:bg-ink-raised sm:px-5", children: [_jsx("span", { className: "u-eyebrow text-ember", children: t("position.legendTitle") }), _jsxs("span", { className: "flex shrink-0 items-center gap-2 text-ink-muted", children: [_jsx("span", { className: "u-eyebrow hidden text-[0.625rem] sm:inline", children: open ? t("position.legendHide") : t("position.legendShow") }), _jsx("svg", { viewBox: "0 0 16 16", className: `h-3 w-3 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`, fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: _jsx("path", { d: "M3 6l5 5 5-5", strokeLinecap: "round", strokeLinejoin: "round" }) })] })] }) }), open && (_jsxs("div", { id: "position-legend", className: "border-t border-ink-line px-4 py-5 sm:px-5", children: [_jsx("dl", { className: "grid gap-4 sm:grid-cols-2", children: POSITION_ORDER.map((position) => (_jsxs("div", { children: [_jsx("dt", { className: "u-display text-xs text-ink-bright", children: t(`position.${position}`) }), _jsx("dd", { className: "mt-1 text-sm leading-relaxed text-ink-muted", children: t(`position.desc${position}`) })] }, position))) }), _jsx("p", { className: "mt-5 border-t border-ink-line pt-4 text-xs leading-relaxed text-ink-muted", children: t("position.legendNote") })] }))] }));
}
