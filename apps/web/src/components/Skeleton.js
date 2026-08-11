import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Shimmer placeholders. These mirror the shape of the real content they stand
 * in for, so the layout does not jump when data lands - the point of a skeleton
 * over a spinner.
 */
export function Shimmer({ className = "" }) {
    return (_jsx("span", { className: `relative block overflow-hidden rounded bg-ink-raised ${className}`, "aria-hidden": "true", children: _jsx("span", { className: "absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r\n                   from-transparent via-white/[0.055] to-transparent" }) }));
}
/** Matches the geometry of MatchCard. */
export function MatchCardSkeleton() {
    return (_jsxs("div", { className: "u-rule flex items-center gap-4 border-b px-4 py-5 sm:px-6", children: [_jsx(Shimmer, { className: "h-4 w-11 shrink-0" }), _jsxs("div", { className: "flex flex-1 flex-col gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shimmer, { className: "h-8 w-8 rounded-full" }), _jsx(Shimmer, { className: "h-3.5 w-32 max-w-[38vw]" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shimmer, { className: "h-8 w-8 rounded-full" }), _jsx(Shimmer, { className: "h-3.5 w-24 max-w-[30vw]" })] })] }), _jsx(Shimmer, { className: "h-9 w-12 shrink-0" })] }));
}
export function TableRowSkeleton() {
    return (_jsxs("div", { className: "u-rule flex items-center gap-3 border-b px-4 py-3.5", children: [_jsx(Shimmer, { className: "h-3.5 w-4 shrink-0" }), _jsx(Shimmer, { className: "h-8 w-8 shrink-0 rounded-full" }), _jsx(Shimmer, { className: "h-3.5 flex-1 max-w-[10rem]" }), _jsx(Shimmer, { className: "hidden h-3.5 w-8 sm:block" }), _jsx(Shimmer, { className: "h-3.5 w-8" })] }));
}
export function PlayerCardSkeleton() {
    return (_jsxs("div", { className: "u-rule border p-5", children: [_jsxs("div", { className: "flex items-center gap-3.5", children: [_jsx(Shimmer, { className: "h-11 w-11 rounded-full" }), _jsxs("div", { className: "flex flex-1 flex-col gap-2", children: [_jsx(Shimmer, { className: "h-3.5 w-28" }), _jsx(Shimmer, { className: "h-2.5 w-16" })] })] }), _jsx(Shimmer, { className: "mt-5 h-2.5 w-20" })] }));
}
export function ArticleCardSkeleton() {
    return (_jsxs("div", { className: "u-rule border", children: [_jsx(Shimmer, { className: "aspect-[16/10] w-full rounded-none" }), _jsxs("div", { className: "flex flex-col gap-3 p-5", children: [_jsx(Shimmer, { className: "h-2.5 w-24" }), _jsx(Shimmer, { className: "h-4 w-full" }), _jsx(Shimmer, { className: "h-4 w-2/3" })] })] }));
}
export function SkeletonList({ count, children, }) {
    return (_jsx("div", { role: "status", "aria-busy": "true", "aria-label": "Loading", children: Array.from({ length: count }, (_, i) => (_jsx("div", { children: children(i) }, i))) }));
}
