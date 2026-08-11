import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANG, statusTranslationKey, translate, } from "@/lib/i18n";
const STORAGE_KEY = "esquinazo:lang";
const LanguageContext = createContext(null);
/**
 * Reads the stored preference, falling back to the browser's own language and
 * then English. Runs lazily inside useState so it happens once, before first
 * paint, rather than as an effect that would flash English first.
 */
function initialLang() {
    if (typeof window === "undefined")
        return DEFAULT_LANG;
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "es")
            return stored;
    }
    catch {
        // Private mode or blocked storage - fall through to the browser default.
    }
    return window.navigator.language.toLowerCase().startsWith("es") ? "es" : DEFAULT_LANG;
}
export function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(initialLang);
    // Keep <html lang> honest: screen readers switch pronunciation on it, and it
    // is what `:lang()` and translation tooling key off.
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);
    const setLang = useCallback((next) => {
        setLangState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        }
        catch {
            // A failed write only costs persistence, not the switch itself.
        }
    }, []);
    const value = useMemo(() => ({
        lang,
        setLang,
        t: (key, vars) => translate(lang, key, vars),
    }), [lang, setLang]);
    return _jsx(LanguageContext.Provider, { value: value, children: children });
}
export function useLanguage() {
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
/**
 * Translates an API-Football status short code ("FT", "1H") for display.
 * An unrecognised code - the provider adding one we have not seen - falls back
 * to the code itself rather than a blank or a raw dictionary key.
 */
export function useStatusLabel() {
    const t = useT();
    return useCallback((short) => {
        const key = statusTranslationKey(short);
        return key ? t(key) : short.replace(/_/g, " ");
    }, [t]);
}
