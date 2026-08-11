/**
 * External destinations, kept in one place so the Ko-fi handle is a one-line
 * change rather than a search across components.
 *
 * Set VITE_KOFI_URL to override at build time.
 */
export const KOFI_URL = import.meta.env.VITE_KOFI_URL ?? "https://ko-fi.com/YOUR_KOFI";
export const SPONSOR = {
    name: "Nodelync",
    url: "https://nodelync.com",
};
export const DATA_PROVIDER = {
    name: "API-Football",
    url: "https://www.api-football.com",
};
