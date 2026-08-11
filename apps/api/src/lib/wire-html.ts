/**
 * Static HTML for the Wire.
 *
 * Everything interpolated here originates in a CMS, so every value is escaped
 * on the way in rather than trusted. Two escaping rules are not
 * interchangeable and are kept separate on purpose:
 *
 *   - escapeHtml   for text and attribute values
 *   - jsonLd       for the structured-data block, where the danger is a "</script>"
 *                  sequence inside a string closing the element early
 *
 * Styling is inline because these pages are served straight from S3 with no
 * build step: they cannot import the SPA's stylesheet, and a hashed CSS
 * filename would go stale the next time the frontend is rebuilt.
 */
import type { PortableTextBlock, WireEntry } from "./sanity";

/** Mirrors the tokens in apps/web/tailwind.config.js. */
const INK = "#0a0a0a";
const INK_RAISED = "#141414";
const INK_LINE = "#232120";
const INK_MUTED = "#a0a0a0";
const INK_BRIGHT = "#f5f5f5";
const EMBER = "#cc5500";
const EMBER_BRIGHT = "#ff6f14";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Manrope:wght@400..800&display=swap";

const DESCRIPTION_MAX = 155;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Serialises structured data for embedding in a <script> element. JSON.stringify
 * alone is not enough: a "</script>" inside any string value would terminate
 * the element and turn the rest of the payload into live markup.
 */
function jsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/**
 * Only http(s) URLs survive. A CMS field is user input, and an unchecked
 * `javascript:` value in an href is an XSS vector.
 */
function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Portable Text (or a plain string) flattened to text, for meta descriptions. */
export function bodyToPlainText(body: WireEntry["body"]): string {
  if (typeof body === "string") return body.trim();
  if (!Array.isArray(body)) return "";

  return body
    .map((block) => (block.children ?? []).map((child) => child.text ?? "").join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const clipped = value.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

/** Wraps a span's text in whichever of the marks we support are present. */
function renderSpan(span: { text?: string; marks?: string[] }): string {
  const text = escapeHtml(span.text ?? "");
  if (!text) return "";

  const marks = span.marks ?? [];
  // Unrecognised marks (including link markDefs) fall through to plain text
  // rather than being dropped - losing the emphasis is better than losing
  // the sentence.
  let html = text;
  if (marks.includes("code")) html = `<code>${html}</code>`;
  if (marks.includes("em")) html = `<em>${html}</em>`;
  if (marks.includes("strong")) html = `<strong>${html}</strong>`;
  return html;
}

const BLOCK_STYLE_TAGS: Record<string, string> = {
  // h1 is reserved for the headline, so the body's own h1 steps down to h2.
  h1: "h2",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  blockquote: "blockquote",
};

function renderBlock(block: PortableTextBlock): string {
  const inner = (block.children ?? []).map(renderSpan).join("");
  if (!inner) return "";

  const tag = BLOCK_STYLE_TAGS[block.style ?? "normal"] ?? "p";
  return `<${tag}>${inner}</${tag}>`;
}

/** Renders the body whether it arrives as Portable Text or a plain string. */
export function renderBody(body: WireEntry["body"]): string {
  if (typeof body === "string") {
    return body
      .split(/\n{2,}/)
      .map((para) => para.trim())
      .filter(Boolean)
      .map((para) => `<p>${escapeHtml(para)}</p>`)
      .join("\n");
  }

  if (!Array.isArray(body)) return "";
  return body.map(renderBlock).filter(Boolean).join("\n");
}

function formatDate(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:${INK};color:${INK_BRIGHT};font-family:"Manrope",system-ui,sans-serif;
line-height:1.65;-webkit-font-smoothing:antialiased}
a{color:${EMBER_BRIGHT};text-decoration:none}
a:hover{text-decoration:underline}
.frame{max-width:44rem;margin:0 auto;padding:0 clamp(1.25rem,5vw,2.5rem)}
.topbar{border-bottom:1px solid ${INK_LINE}}
.topbar .frame{display:flex;align-items:center;gap:.75rem;height:4rem}
.wordmark{font-family:"Archivo",Arial Narrow,sans-serif;font-weight:800;letter-spacing:.02em;
font-size:1rem;color:${INK_BRIGHT};text-transform:uppercase}
.eyebrow{font-family:"Archivo",Arial Narrow,sans-serif;font-size:.6875rem;letter-spacing:.24em;
text-transform:uppercase;color:${EMBER_BRIGHT};margin:0}
h1{font-family:"Archivo",Arial Narrow,sans-serif;font-size:clamp(2rem,5vw,3.25rem);line-height:1.02;
letter-spacing:-.02em;margin:1.25rem 0 0;color:${INK_BRIGHT}}
.meta{color:${INK_MUTED};font-size:.8125rem;margin:1rem 0 0}
article{padding:3rem 0 4rem}
.body{margin-top:2.5rem;border-top:1px solid ${INK_LINE};padding-top:2.5rem}
.body p{margin:0 0 1.25rem}
.body h2,.body h3,.body h4,.body h5,.body h6{font-family:"Archivo",Arial Narrow,sans-serif;
line-height:1.15;margin:2.5rem 0 1rem;color:${INK_BRIGHT}}
.body blockquote{margin:2rem 0;padding-left:1.25rem;border-left:2px solid ${EMBER};
color:${INK_MUTED};font-style:italic}
.body code{background:${INK_RAISED};padding:.15em .4em;font-size:.9em}
.aside{margin-top:3rem;border-top:1px solid ${INK_LINE};padding-top:1.5rem;font-size:.8125rem;
color:${INK_MUTED}}
.aside a{color:${EMBER_BRIGHT}}
footer{border-top:1px solid ${INK_LINE};padding:2rem 0;color:${INK_MUTED};font-size:.75rem}
ul.entries{list-style:none;margin:0;padding:0}
ul.entries li{border-bottom:1px solid ${INK_LINE}}
ul.entries a{display:block;padding:1.5rem 0;color:inherit}
ul.entries a:hover{text-decoration:none;background:${INK_RAISED}}
ul.entries h2{font-family:"Archivo",Arial Narrow,sans-serif;font-size:1.25rem;line-height:1.2;
margin:.5rem 0 0;color:${INK_BRIGHT}}
ul.entries a:hover h2{color:${EMBER_BRIGHT}}
.tag{font-family:"Archivo",Arial Narrow,sans-serif;font-size:.625rem;letter-spacing:.18em;
text-transform:uppercase;color:${INK_MUTED}}
`.trim();

function shell(options: {
  lang: string;
  title: string;
  head: string;
  content: string;
}): string {
  return `<!doctype html>
<html lang="${escapeHtml(options.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="${INK}">
<title>${escapeHtml(options.title)}</title>
${options.head}
<link rel="icon" href="/esquinazo-mark.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS_HREF}">
<style>${BASE_CSS}</style>
</head>
<body>
<header class="topbar"><div class="frame"><a class="wordmark" href="/">Esquinazo</a></div></header>
${options.content}
<footer><div class="frame">© ${new Date().getUTCFullYear()} Esquinazo</div></footer>
</body>
</html>`;
}

export interface RenderContext {
  siteUrl: string;
}

/** Canonical URL for an entry. Kept in one place so the page, the sitemap and the invalidation agree. */
export function entryUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/$/, "")}/news/${slug}`;
}

export function renderEntryPage(entry: WireEntry, ctx: RenderContext): string {
  const lang = entry.language === "es" ? "es" : "en";
  const canonical = entryUrl(ctx.siteUrl, entry.slug);
  const plain = bodyToPlainText(entry.body);
  const description = truncate(plain || entry.headline, DESCRIPTION_MAX);
  const source = safeUrl(entry.sourceUrl);
  const published = formatDate(entry.publishedAt, lang);
  const kind = entry.contentType === "opinion" ? "Opinion" : "News";

  const structured: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: entry.headline,
    description,
    datePublished: entry.publishedAt,
    dateModified: entry.publishedAt,
    inLanguage: lang,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    publisher: {
      "@type": "Organization",
      name: "Esquinazo",
      logo: {
        "@type": "ImageObject",
        url: `${ctx.siteUrl.replace(/\/$/, "")}/esquinazo-mark.svg`,
      },
    },
  };
  if (source) {
    structured.isBasedOn = source;
    if (entry.sourceLabel) {
      structured.citation = { "@type": "CreativeWork", name: entry.sourceLabel, url: source };
    }
  }

  const head = `<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Esquinazo">
<meta property="og:title" content="${escapeHtml(entry.headline)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:locale" content="${lang === "es" ? "es_ES" : "en_GB"}">
<meta property="article:published_time" content="${escapeHtml(entry.publishedAt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(entry.headline)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<script type="application/ld+json">${jsonLd(structured)}</script>`;

  const sourceLine = source
    ? `<p>Source: <a href="${escapeHtml(source)}" rel="nofollow noopener external" target="_blank">${escapeHtml(
        entry.sourceLabel ?? source,
      )}</a></p>`
    : "";

  // The SPA has no per-player route (players are a modal on /players, which
  // deliberately does not change the URL), so this deep-links as far as the
  // app actually goes: the club's squad when the team is known, the squads
  // index otherwise.
  const relatedName = entry.relatedPlayer?.name;
  const teamId = entry.relatedTeam?.id;
  const relatedLine = relatedName
    ? `<p>More on <a href="/players${teamId ? `?team=${encodeURIComponent(String(teamId))}` : ""}">${escapeHtml(
        relatedName,
      )}</a></p>`
    : "";

  const content = `<main class="frame"><article>
<p class="eyebrow">${escapeHtml(kind)}</p>
<h1>${escapeHtml(entry.headline)}</h1>
<p class="meta"><time datetime="${escapeHtml(entry.publishedAt)}">${escapeHtml(published)}</time></p>
<div class="body">${renderBody(entry.body)}</div>
<div class="aside">${sourceLine}${relatedLine}<p><a href="/news">← The Wire</a></p></div>
</article></main>`;

  return shell({ lang, title: `${entry.headline} — Esquinazo`, head, content });
}

export function renderListingPage(entries: WireEntry[], ctx: RenderContext): string {
  const canonical = `${ctx.siteUrl.replace(/\/$/, "")}/news`;
  const description = "Football news and opinion from Esquinazo.";

  const head = `<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Esquinazo">
<meta property="og:title" content="The Wire — Esquinazo">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">`;

  const items = entries
    .map((entry) => {
      const lang = entry.language === "es" ? "es" : "en";
      const kind = entry.contentType === "opinion" ? "Opinion" : "News";
      return `<li><a href="/news/${escapeHtml(entry.slug)}">
<span class="tag">${escapeHtml(kind)} · ${escapeHtml(formatDate(entry.publishedAt, lang))}</span>
<h2>${escapeHtml(entry.headline)}</h2>
</a></li>`;
    })
    .join("\n");

  const content = `<main class="frame"><article>
<p class="eyebrow">The Wire</p>
<h1>The Wire</h1>
<p class="meta">Football news and opinion.</p>
<div class="body"><ul class="entries">${items}</ul></div>
<div class="aside"><p><a href="/news/archive">Older entries →</a></p></div>
</article></main>`;

  return shell({ lang: "en", title: "The Wire — Esquinazo", head, content });
}

/* ------------------------------ sitemap ------------------------------ */

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

/**
 * Pulls entries out of a sitemap this function previously wrote. Deliberately
 * narrow: it parses our own known-shape output, not arbitrary XML.
 */
export function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
    const loc = /<loc>([\s\S]*?)<\/loc>/.exec(block)?.[1]?.trim();
    if (!loc) continue;
    const lastmod = /<lastmod>([\s\S]*?)<\/lastmod>/.exec(block)?.[1]?.trim();
    entries.push(lastmod ? { loc, lastmod } : { loc });
  }
  return entries;
}

/**
 * Merges one URL into the set, keyed by loc so republishing the same entry
 * updates its lastmod instead of appending a duplicate. Newest first.
 */
export function mergeSitemap(existing: SitemapEntry[], incoming: SitemapEntry): string {
  const byLoc = new Map(existing.map((entry) => [entry.loc, entry]));
  byLoc.set(incoming.loc, incoming);

  const sorted = [...byLoc.values()].sort((a, b) => (b.lastmod ?? "").localeCompare(a.lastmod ?? ""));

  const urls = sorted
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${escapeHtml(entry.lastmod)}</lastmod>` : "";
      return `  <url><loc>${escapeHtml(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
