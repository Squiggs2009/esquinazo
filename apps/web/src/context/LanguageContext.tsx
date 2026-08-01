import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANG,
  translate,
  type Lang,
  type TranslationKey,
  type TranslationVars,
} from "@/lib/i18n";

const STORAGE_KEY = "esquinazo:lang";

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

/**
 * Reads the stored preference, falling back to the browser's own language and
 * then English. Runs lazily inside useState so it happens once, before first
 * paint, rather than as an effect that would flash English first.
 */
function initialLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    // Private mode or blocked storage - fall through to the browser default.
  }

  return window.navigator.language.toLowerCase().startsWith("es") ? "es" : DEFAULT_LANG;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Keep <html lang> honest: screen readers switch pronunciation on it, and it
  // is what `:lang()` and translation tooling key off.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A failed write only costs persistence, not the switch itself.
    }
  }, []);

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside a LanguageProvider");
  }
  return value;
}

/** Convenience for the common case of only needing the translate function. */
export function useT() {
  return useLanguage().t;
}
