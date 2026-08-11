import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useNews } from "@/lib/queries";
import { articleDate } from "@/lib/format";
import { useReveal } from "@/lib/motion";
import { useT } from "@/context/LanguageContext";
/**
 * Homepage headline rundown. Unlike the dedicated /news page, this section
 * explains nothing when there is no data - it simply does not render, so a
 * missing feed (the API has no /news endpoint yet) never leaves an apology
 * sitting on the highest-traffic page. It lights up on its own once the
 * endpoint ships. See News.tsx for the explicit "not wired up yet" state.
 */
export function Headlines() {
    const { data, isPending, isError } = useNews();
    const articles = data?.data.articles ?? [];
    if (isPending || isError || articles.length === 0)
        return null;
    return _jsx(HeadlineRundown, { articles: articles.slice(0, 4) });
}
/**
 * A separate component, not an inline branch of Headlines: useReveal's
 * ScrollTrigger attaches to whatever DOM node exists on this component's
 * first render. Toggling the same component instance between null and real
 * content would leave the ref unset on mount and the animation would never
 * arm - see FixtureList / DayGroups / Table / PlayerGrid for the same split.
 */
function HeadlineRundown({ articles }) {
    const scope = useReveal({ y: 20, stagger: 0.06 });
    const t = useT();
    const [lead, ...rest] = articles;
    if (!lead)
        return null;
    return (_jsxs("section", { ref: scope, className: "u-frame border-b border-ink-line py-14 sm:py-20", children: [_jsxs("div", { className: "mb-8 flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "js-reveal u-eyebrow text-ember", children: t("home.headlines") }), _jsx("h2", { className: "js-reveal u-display mt-3 text-title", children: t("home.aroundLeagues") })] }), _jsx(Link, { to: "/news", className: "js-reveal u-display text-xs text-ember hover:text-ember-bright", children: t("home.allNews") })] }), _jsxs("div", { className: "js-reveal grid gap-px bg-ink-line md:grid-cols-[1.3fr_1fr]", children: [_jsx(LeadHeadline, { article: lead }), rest.length > 0 && (_jsx("div", { className: "flex min-w-0 flex-col gap-px bg-ink-line", children: rest.map((article) => (_jsx(MinorHeadline, { article: article }, article.id))) }))] })] }));
}
function LeadHeadline({ article }) {
    const Wrapper = article.url ? "a" : "div";
    return (_jsxs(Wrapper, { ...(article.url
            ? { href: article.url, target: "_blank", rel: "noopener noreferrer" }
            : {}), className: "group block min-w-0 bg-ink p-6 transition-colors duration-500 ease-out hover:bg-ink-raised sm:p-8", children: [_jsxs("p", { className: "u-eyebrow text-ember", children: [article.source ?? "Esquinazo", " \u00B7 ", articleDate(article.publishedAt)] }), _jsx("h3", { className: "u-display mt-3 break-words text-title leading-tight text-ink-bright transition-colors duration-300 group-hover:text-ember", children: article.title }), article.summary && (_jsx("p", { className: "mt-3 line-clamp-2 max-w-lg text-sm leading-relaxed text-ink-muted", children: article.summary }))] }));
}
function MinorHeadline({ article }) {
    const Wrapper = article.url ? "a" : "div";
    return (_jsxs(Wrapper, { ...(article.url
            ? { href: article.url, target: "_blank", rel: "noopener noreferrer" }
            : {}), 
        // Desktop: share the column's height equally so the hairlines between
        // cards are evenly spaced and no ink-line band is left under the last
        // one. py-6 matches the lead card's padding step rather than sitting a
        // step below it. Mobile keeps the content-height stack unchanged.
        className: "group block min-w-0 bg-ink px-6 py-5 transition-colors duration-300\n                 hover:bg-ink-raised md:flex md:flex-1 md:flex-col md:justify-center md:py-6", children: [_jsxs("p", { className: "u-eyebrow", children: [article.source ?? "Esquinazo", " \u00B7 ", articleDate(article.publishedAt)] }), _jsx("h4", { className: "mt-2 truncate text-sm font-semibold text-ink-bright transition-colors duration-300 group-hover:text-ember", children: article.title })] }));
}
