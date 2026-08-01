import { useState } from "react";
import { useT } from "@/context/LanguageContext";
import { POSITION_ORDER } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

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

  return (
    <section className="mb-8 border border-ink-line">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="position-legend"
          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left
                     transition-colors duration-300 hover:bg-ink-raised sm:px-5"
        >
          <span className="u-eyebrow text-ember">{t("position.legendTitle")}</span>
          <span className="flex shrink-0 items-center gap-2 text-ink-muted">
            <span className="u-eyebrow hidden text-[0.625rem] sm:inline">
              {open ? t("position.legendHide") : t("position.legendShow")}
            </span>
            <svg
              viewBox="0 0 16 16"
              className={`h-3 w-3 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </h2>

      {open && (
        <div id="position-legend" className="border-t border-ink-line px-4 py-5 sm:px-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            {POSITION_ORDER.map((position) => (
              <div key={position}>
                <dt className="u-display text-xs text-ink-bright">
                  {t(`position.${position}` as TranslationKey)}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {t(`position.desc${position}` as TranslationKey)}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 border-t border-ink-line pt-4 text-xs leading-relaxed text-ink-muted">
            {t("position.legendNote")}
          </p>
        </div>
      )}
    </section>
  );
}
