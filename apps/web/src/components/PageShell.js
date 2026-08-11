import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap, MOTION_OK, EASE, ScrollTrigger } from "@/lib/motion";
/**
 * Cross-route fade. Keyed on pathname so the incoming page animates in from
 * scratch, and ScrollTrigger is refreshed afterwards - the new page has
 * different geometry and stale triggers would fire at the wrong offsets.
 */
export function PageTransition({ children }) {
    const location = useLocation();
    const ref = useRef(null);
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        if (!MOTION_OK || !ref.current)
            return;
        const tween = gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: EASE, onComplete: () => ScrollTrigger.refresh() });
        return () => {
            tween.kill();
        };
    }, [location.pathname]);
    return (_jsx("div", { ref: ref, children: children }, location.pathname));
}
/**
 * Standard page header: eyebrow, oversized title, optional lede. Left-aligned
 * and asymmetric - the title runs wide while the lede stays in a narrow measure.
 */
export function PageHeader({ eyebrow, title, lede, aside, }) {
    const ref = useRef(null);
    useLayoutEffect(() => {
        if (!MOTION_OK || !ref.current)
            return;
        const context = gsap.context((self) => {
            const targets = self.selector?.(".js-head");
            if (!targets?.length)
                return;
            gsap.fromTo(targets, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.07, ease: EASE });
        }, ref);
        return () => context.revert();
    }, []);
    return (_jsx("header", { ref: ref, className: "u-frame pb-10 pt-[calc(var(--nav-h)+3.5rem)] sm:pb-12", children: _jsxs("div", { className: "flex flex-wrap items-end justify-between gap-6", children: [_jsxs("div", { children: [_jsxs("p", { className: "js-head u-eyebrow flex items-center gap-2 text-ember-bright", children: [_jsx("span", { className: "h-2 w-2 shrink-0 bg-ember", "aria-hidden": "true" }), eyebrow] }), _jsx("h1", { className: "js-head u-display mt-4 text-display text-ink-bright", children: title }), lede && (_jsx("p", { className: "js-head mt-4 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base", children: lede }))] }), aside && _jsx("div", { className: "js-head", children: aside })] }) }));
}
/** Sets the document title per route. */
export function useTitle(title) {
    useEffect(() => {
        document.title = `${title} — Esquinazo`;
    }, [title]);
}
