import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LEAGUES } from "@/lib/api";
/**
 * League filter. A vertical rail on desktop; on mobile it collapses into a
 * select instead, so every league is one tap away rather than a drag through
 * a horizontal scroller.
 */
export function LeagueRail({ value, onChange, label = "League", }) {
    return (_jsxs("nav", { "aria-label": label, className: "lg:sticky lg:top-[calc(var(--nav-h)+2rem)]", children: [_jsx("p", { className: "u-eyebrow mb-4 hidden lg:block", children: label }), _jsxs("label", { className: "block lg:hidden", children: [_jsx("span", { className: "sr-only", children: label }), _jsx("select", { value: value, onChange: (event) => onChange(Number(event.target.value)), className: "w-full border border-ink-line bg-ink-raised px-4 py-3 text-sm text-ink-bright\n                     transition-colors duration-300 hover:border-ink-muted focus:border-ember", children: LEAGUES.map((league) => (_jsxs("option", { value: league.id, children: [league.code, " \u00B7 ", league.name] }, league.id))) })] }), _jsx("ul", { className: "hidden lg:flex lg:flex-col lg:mx-0 lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0", children: LEAGUES.map((league) => {
                    const active = league.id === value;
                    return (_jsx("li", { className: "shrink-0 lg:w-full", children: _jsxs("button", { type: "button", onClick: () => onChange(league.id), "aria-current": active ? "true" : undefined, className: `group flex w-full items-baseline gap-2.5 whitespace-nowrap
                            border-ink-line px-3.5 py-2.5 text-left transition-colors duration-300
                            lg:border-l-2 lg:px-4
                            ${active
                                ? "bg-ember/10 text-ink-bright lg:border-l-ember lg:bg-transparent"
                                : "text-ink-muted hover:text-ink-bright lg:hover:border-l-ink-muted"}`, children: [_jsx("span", { className: "u-display text-xs", children: league.code }), _jsx("span", { className: "text-sm", children: league.name }), _jsx("span", { className: "ml-auto hidden text-[0.6875rem] text-ink-muted lg:inline", children: league.country })] }) }, league.id));
                }) })] }));
}
