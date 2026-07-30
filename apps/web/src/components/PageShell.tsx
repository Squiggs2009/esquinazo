import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap, MOTION_OK, EASE, ScrollTrigger } from "@/lib/motion";

/**
 * Cross-route fade. Keyed on pathname so the incoming page animates in from
 * scratch, and ScrollTrigger is refreshed afterwards - the new page has
 * different geometry and stale triggers would fire at the wrong offsets.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    if (!MOTION_OK || !ref.current) return;

    const tween = gsap.fromTo(
      ref.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: EASE, onComplete: () => ScrollTrigger.refresh() },
    );

    return () => {
      tween.kill();
    };
  }, [location.pathname]);

  return (
    <div ref={ref} key={location.pathname}>
      {children}
    </div>
  );
}

/**
 * Standard page header: eyebrow, oversized title, optional lede. Left-aligned
 * and asymmetric - the title runs wide while the lede stays in a narrow measure.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  aside?: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!MOTION_OK || !ref.current) return;

    const context = gsap.context((self) => {
      const targets = self.selector?.(".js-head") as HTMLElement[] | undefined;
      if (!targets?.length) return;
      gsap.fromTo(
        targets,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.85, stagger: 0.07, ease: EASE },
      );
    }, ref);

    return () => context.revert();
  }, []);

  return (
    <header ref={ref} className="u-frame pb-10 pt-[calc(var(--nav-h)+3.5rem)] sm:pb-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="js-head u-eyebrow text-ember">{eyebrow}</p>
          <h1 className="js-head u-display mt-4 text-display text-ink-bright">{title}</h1>
          {lede && (
            <p className="js-head mt-4 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base">
              {lede}
            </p>
          )}
        </div>
        {aside && <div className="js-head">{aside}</div>}
      </div>
    </header>
  );
}

/** Sets the document title per route. */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — Esquinazo`;
  }, [title]);
}
