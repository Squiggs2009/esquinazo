import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ApiError } from "@/lib/api";
import { useT } from "@/context/LanguageContext";
/**
 * Failure and empty states. Both explain what happened and what the reader can
 * do next; neither is a shrug.
 */
function Frame({ children }) {
    return (_jsx("div", { className: "u-rule border border-dashed px-6 py-14 text-center sm:py-20", children: _jsx("div", { className: "mx-auto max-w-md", children: children }) }));
}
export function ErrorState({ error, onRetry }) {
    const t = useT();
    const api = error instanceof ApiError ? error : null;
    // Upstream provider failures are not the reader's fault and not retryable in
    // any useful sense, so they get different copy from a dropped connection.
    const isUpstream = api !== null && api.status >= 500;
    const isNotFound = api?.status === 404;
    const isRateLimited = api?.status === 429;
    const headline = isNotFound
        ? t("state.notFoundTitle")
        : isRateLimited
            ? t("state.rateLimitTitle")
            : isUpstream
                ? t("state.upstreamTitle")
                : t("state.genericTitle");
    // The upstream message is only ever English, so it is used as a last resort
    // and the translated generic wins whenever the language is not English.
    const detail = isNotFound
        ? t("state.notFoundDetail")
        : isRateLimited
            ? t("state.rateLimitDetail")
            : isUpstream
                ? t("state.upstreamDetail")
                : t("state.genericDetail");
    return (_jsxs(Frame, { children: [_jsxs("p", { className: "u-eyebrow text-ember", children: [t("state.errorBadge"), api?.status ? ` ${api.status}` : ""] }), _jsx("h2", { className: "u-display mt-3 text-title text-ink-bright", children: headline }), _jsx("p", { className: "mt-3 text-sm leading-relaxed text-ink-muted", children: detail }), onRetry && !isNotFound && (_jsx("button", { type: "button", onClick: onRetry, className: "u-display mt-7 border border-ember px-5 py-2 text-xs uppercase tracking-wider\n                     text-ember transition-colors duration-300 hover:bg-ember hover:text-ink", children: t("state.retry") }))] }));
}
export function EmptyState({ headline, detail, action, }) {
    return (_jsxs(Frame, { children: [_jsx("h2", { className: "u-display text-title text-ink-bright", children: headline }), _jsx("p", { className: "mt-3 text-sm leading-relaxed text-ink-muted", children: detail }), action && _jsx("div", { className: "mt-7", children: action })] }));
}
