/**
 * GSAP setup and the reveal primitives used across the site.
 *
 * Everything here is a no-op under prefers-reduced-motion: content is written
 * to the DOM visible by default, and the `is-animated` class that hides reveal
 * targets is only applied when motion is allowed. That way a reduced-motion
 * user (or anyone with JS disabled) never lands on a blank page.
 */
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
export const prefersReducedMotion = () => typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const MOTION_OK = !prefersReducedMotion();
if (MOTION_OK && typeof document !== "undefined") {
    document.documentElement.classList.add("is-animated");
}
/** Exponential decel - matches the `ease-out` curve in the Tailwind config. */
export const EASE = "power4.out";
/**
 * Fade-and-rise for every `.js-reveal` inside the returned ref, driven by
 * ScrollTrigger. Returns a ref to spread onto the section element.
 */
export function useReveal(options = {}) {
    const scope = useRef(null);
    const { selector = ".js-reveal", y = 28, stagger = 0.08, duration = 0.9, start = "top 85%", delay = 0, } = options;
    useLayoutEffect(() => {
        if (!MOTION_OK || !scope.current)
            return;
        const context = gsap.context((self) => {
            // Scope the query to this section. gsap.utils.toArray would search the
            // whole document and animate other sections' reveal targets too.
            const targets = self.selector?.(selector);
            if (!targets || targets.length === 0)
                return;
            gsap.fromTo(targets, { opacity: 0, y }, {
                opacity: 1,
                y: 0,
                duration,
                delay,
                stagger,
                ease: EASE,
                scrollTrigger: { trigger: scope.current, start, once: true },
            });
        }, scope);
        return () => context.revert();
    }, [selector, y, stagger, duration, start, delay]);
    return scope;
}
/** Counts an element's number up when it scrolls into view. */
export function useCounter(ref, value, { duration = 1.8, delay = 0 } = {}) {
    useLayoutEffect(() => {
        const node = ref.current;
        if (!node)
            return;
        if (!MOTION_OK) {
            node.textContent = value.toLocaleString();
            return;
        }
        const counter = { current: 0 };
        const tween = gsap.to(counter, {
            current: value,
            duration,
            delay,
            ease: EASE,
            onUpdate: () => {
                node.textContent = Math.floor(counter.current).toLocaleString();
            },
            scrollTrigger: { trigger: node, start: "top 92%", once: true },
        });
        return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
        };
    }, [ref, value, duration, delay]);
}
/** Slow vertical drift for the hero backdrop. */
export function useParallax(ref, distance = 120) {
    useLayoutEffect(() => {
        const node = ref.current;
        if (!MOTION_OK || !node)
            return;
        const tween = gsap.to(node, {
            yPercent: distance / 10,
            ease: "none",
            scrollTrigger: {
                trigger: node.parentElement ?? node,
                start: "top top",
                end: "bottom top",
                scrub: 0.6,
            },
        });
        return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
        };
    }, [ref, distance]);
}
export { gsap, ScrollTrigger };
