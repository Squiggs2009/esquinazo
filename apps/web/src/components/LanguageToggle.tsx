import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";

/**
 * Two-state switch rather than a dropdown: with exactly two languages a select
 * would hide half the choice behind a tap. The active side is filled ember, so
 * the current language reads at a glance without a checkmark.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className={`flex shrink-0 border border-ink-line ${className}`}
    >
      {LANGUAGES.map((option) => {
        const active = option.code === lang;

        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLang(option.code)}
            aria-pressed={active}
            title={option.name}
            className={`u-display px-2.5 py-1.5 text-[0.6875rem] tracking-wider transition-colors
                        duration-300 ${
                          active
                            ? "bg-ember text-ink"
                            : "text-ink-muted hover:text-ink-bright"
                        }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
