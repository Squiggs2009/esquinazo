/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KOFI_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Defined by the gtag.js snippet in index.html. Optional because an ad blocker
 * can stop the loader without stopping the app.
 */
interface Window {
  gtag?: (...args: unknown[]) => void;
}
