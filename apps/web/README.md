# Esquinazo — web

React frontend for [esquinazo.io](https://esquinazo.io). Live scores, tables, squads and news
across Europe's major leagues.

**Stack:** React 18 · Vite 5 · TypeScript (strict) · Tailwind CSS 3 · TanStack Query 5 ·
React Router 6 · GSAP + ScrollTrigger

---

## Quick start

```bash
npm install
cp .env.example .env.local   # set VITE_KOFI_URL, optionally VITE_API_BASE_URL
npm run dev                  # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR and the API proxy |
| `npm run build` | Typechecks (`tsc -b`), then bundles to `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Typecheck only |

### Why the dev proxy exists

The deployed API sends `Access-Control-Allow-Origin` for `https://esquinazo.io` and
`https://www.esquinazo.io` only, so a browser on `localhost:5173` is blocked by CORS. In dev,
requests go to `/api/*` and Vite proxies them server-side, where CORS does not apply. Production
builds call `https://api.esquinazo.io` directly. See `server.proxy` in `vite.config.ts` and
`API_BASE` in `src/lib/api.ts`.

---

## Environment

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://api.esquinazo.io` | Proxy target in dev, fetch origin in prod |
| `VITE_KOFI_URL` | `https://ko-fi.com/YOUR_KOFI` | **Placeholder** — set to your real Ko-fi page |

Only `VITE_`-prefixed variables reach the browser. Anything in here is public.

---

## Structure

```
src/
  lib/
    api.ts        fetch client, response types, league list
    queries.ts    TanStack Query hooks (cache windows mirror the server TTLs)
    format.ts     initials, dates, score/form helpers
    motion.ts     GSAP setup, reveal/counter/parallax hooks
    links.ts      external URLs (Ko-fi, sponsor, data provider)
  components/     Nav, Footer, MatchCard, ScoreTicker, LeagueRail, Badges,
                  Skeleton, States, PageShell
  pages/          Home, Fixtures, MatchDetail, Standings, Players, News, NotFound
```

Route chunks are lazy-loaded; only the hero ships in the initial bundle. `gsap` and
`@tanstack/react-query` are split into their own chunks.

---

## Design system

Defined in `tailwind.config.js` and `src/index.css`.

| Token | Value | Use |
| --- | --- | --- |
| `ink` | `#0a0a0a` | Page background |
| `ink-raised` | `#141414` | Cards, hover surfaces |
| `ink-line` | `#232120` | Hairline rules (warmed toward the accent) |
| `ink-bright` | `#f5f5f5` | Primary text |
| `ink-muted` | `#a0a0a0` | Secondary text |
| `ember` | `#cc5500` | Primary accent |
| `blood` | `#8b0000` | Secondary accent, losses, relegation |

**Type:** Archivo (variable width axis, run expanded for display) + Manrope for body. Scores and
tables use `.tnum` tabular figures so digits never shift column widths.

**Utilities:** `.u-display` (stadium signage), `.u-eyebrow` (tracked caps label), `.u-frame`
(page gutter), `.u-slab` (skewed broadcast lower-third), `.u-rule` (hairline border).

Dark only, by design — there is no theme toggle.

---

## Motion

GSAP ScrollTrigger drives fade-up reveals (`useReveal`), the hero letter cascade, counter
animations (`useCounter`) and hero parallax (`useParallax`).

Every animation is disabled under `prefers-reduced-motion: reduce`. Reveal targets are only
hidden when the `is-animated` class is present, which JS adds solely when motion is allowed — so
reduced-motion visitors and anyone without JS see fully visible content rather than a blank page.

---

## API

Handlers return `{ data, meta }`; `meta.source` is `cache | upstream | stale-cache`. The client
unwraps `data` in `apiGet`.

| Hook | Endpoint | Cache |
| --- | --- | --- |
| `useFixtures` | `GET /fixtures?competition=` | 60s, polls every 60s |
| `useStandings` | `GET /standings?competition=` | 5 min |
| `useSquad` | `GET /players?team=` | 60 min |
| `useTransfers` | `GET /transfers?person=` | 60 min |
| `useNews` | `GET /news` | 10 min — **endpoint does not exist yet** |

4xx responses are never retried; 5xx retries twice.

### Known gaps

- **`/news` is not implemented** on the API. The page treats a 404 as "not published yet" and
  shows an empty state rather than an error.
- **No `/match/:id` endpoint.** Match detail finds the fixture inside the cached `/fixtures`
  response, so a match outside the current feed window shows a not-found state.
- **No event-level data** on the provider's free tier, so the match timeline shows score
  progression (half-time, full-time) instead of inventing goal minutes.
- **`/transfers` is tier-gated** by football-data.org and returns 502 with `upstreamStatus: 403`
  on the free plan.
- **Players is squad-scoped**, not a global index — the API serves players by team.

---

## Deploying

```bash
npm run deploy
```

This builds, syncs `dist/` to S3, and invalidates CloudFront in one step — the bucket name and
distribution ID are always read from `terraform output`, never hand-typed, so a mistyped
distribution ID (e.g. `E2NDZI1129HPPN` vs the real `E2NDZ11129HPPN`) can't happen. See
[`scripts/deploy.mjs`](./scripts/deploy.mjs).

CloudFront is configured to rewrite 403/404 to `/index.html` with a 200, so client-side routes
resolve on hard refresh.

---

## Accessibility

Skip link, labelled landmarks, `aria-current` on active nav items, visible focus rings, live
regions marked `aria-busy` while loading, and decorative ticker duplicates hidden from the
accessibility tree. Colour is never the only signal — form badges carry W/D/L letters alongside
their colour.
