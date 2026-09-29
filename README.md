# Greece 2027

A trip-planning app for a Greek island-hopping boat trip, July 2027. A [Next.js](https://nextjs.org) app (App Router, TypeScript), deployed on [Vercel](https://vercel.com). Built with [Material UI](https://mui.com) v9. This is a hobby project, not production software — practices are deliberately kept simple (see "Deliberate shortcuts" below).

## Live site

- **URL:** https://greece-2027.vercel.app
- **Vercel project:** `greece-2027`, team `henrys-projects-7405eafb` (team ID `team_sOOQA1KcoJcZPenMHoEsBZHd`)
- **GitHub repo:** `henrypgill/Greece-2027`, default branch `main`
- The whole site is password-protected (see "Password gate" below). **Current password: `borradaile`.**
- Every push to `main` auto-deploys to production via the Vercel–GitHub integration. There is no staging environment or CI — pushing to `main` is the only deploy path.

## Pages

Phone-only layout, capped at 430px wide (upper bound of common phone widths), centred with a grey background on anything wider. A burger menu in the top `AppBar` opens a `Drawer` with the five routes below (`src/components/AppShell.tsx`). The login page (`/login`) is the only page with no shell around it.

- `/` — Home. Empty (`src/app/page.tsx`).
- `/route` — A full-page Mapbox map (`src/components/RouteMap.tsx`) showing every itinerary item as a numbered pin, in itinerary order, with a straight line between consecutive items and an arrowhead at each line's midpoint showing direction. Opens zoomed to fit all pins. Tapping a pin shows its number and title.
- `/itinerary` — An expandable list (MUI `Accordion`) of itinerary items (`src/app/itinerary/page.tsx`). Row header: number + title. Expanded: start → end (always shown in Greek time, `Europe/Athens`), markdown description (`react-markdown`), optional "Open in Google Maps" button, and the travel time to the next item. Costs are deliberately not shown here.
- `/costs` — Trip total at the top (sum of everything below), then "Overall trip costs" (`TRIP_COSTS` in `src/data/trip-costs.ts`, still static code: flights, charter, etc.), then a day-by-day breakdown of itinerary item costs, grouped by the Greek-time day each item starts (`src/app/costs/page.tsx`).
- `/attendance` — "I'm going" form (first + last name, both required) and the list of everyone who's signed up, in sign-up order (`src/app/attendance/`). Submits via a Server Action (`actions.ts`), which re-checks the session cookie itself since Server Actions can be POSTed to directly. Names are unique case-insensitively, so signing up twice just says you're already on the list. No emails are collected. There's no way to remove a name from the UI yet — do it in the Neon console.

## Itinerary data

The itinerary lives in Neon Postgres, in two tables:

- `itinerary_items`: `sort_order` (display order; ties broken by `id`, gaps fine — seeded as 10, 20, 30…), `title`, `start_at`/`end_at` (`timestamptz`, `end_at >= start_at`), `description` (markdown), `lat`/`lng` (required, where the map pin goes), `google_maps_url` (nullable).
- `itinerary_costs`: `item_id` (→ `itinerary_items.id`, cascade delete), `sort_order`, `item`, `cost` (`numeric(10,2)`, EUR).

`getItinerary()` in `src/lib/itinerary-db.ts` loads it (items in order, each with its costs) as the `ItineraryItem[]` shape defined in `src/data/itinerary.ts`, which also holds the helpers (`getLegs`, `groupByDay`, formatting) and has no server-only imports so client components can use it. The Itinerary, Route and Costs pages all load it per request (`connection()`); the Route page passes it to the client-side `RouteMap` as a prop. Pages show an error message if the database can't be reached. **Order is the trip order** and drives the pin numbers and arrows.

Travel time between items isn't stored; it's derived as the gap between one item's `end` and the next item's `start` (`getLegs()`).

**Seeding:** the tables were first filled from `src/data/itinerary-seed.ts`. This happens exactly once per database, tracked by the row `itinerary-v1` in the `seeds` table, in a single atomic statement, so concurrent server instances can't double-seed and deleting every item won't bring the seed back. Editing the seed file now has no effect. There's no editing UI yet: change the itinerary in the Neon console's table editor (enter times with an offset, e.g. `2027-07-16 15:00+03`). The seeded data had real route/dates but placeholder times for most stops and all end times, empty costs, and an approximate Liems cove pin (Ios island centre).

## Password gate

The whole site requires a password, added because the Mapbox token and trip details shouldn't be public. Full design rationale is in the conversation history, not written down elsewhere — summary:

- `src/proxy.ts` (Next.js Proxy, formerly "Middleware") blocks every request without a valid session cookie, except `/login` and `POST /api/login`.
- `POST /api/login` (`src/app/api/login/route.ts`) checks the password against `APP_PASSWORD` and, if correct, sets an httpOnly cookie (`session`) containing a signed token (`src/lib/auth.ts`, HMAC-SHA256 via Web Crypto, secret is `AUTH_SECRET`). Token format: `<expiry-ms>.<signature>`. Valid for 2 hours (`SESSION_TTL_SECONDS`).
- Failed logins are rate-limited per client IP (`src/lib/rate-limit.ts`): 5 wrong attempts blocks that IP for 2 hours. **Limiter state is an in-memory `Map`**, so it's per server instance and resets on redeploy or cold start — acceptable for deterring casual brute-forcing of a hobby app's password, not a hard guarantee.
- The Mapbox token is never sent to the browser as part of the JS bundle. `RouteMap.tsx` fetches it at runtime from `GET /api/map-config` (`src/app/api/map-config/route.ts`), which only returns it to a request carrying a valid session cookie.
- Client IP is read from `x-forwarded-for`, which Vercel sets itself (not client-controlled), so it can't be spoofed on this platform.

## Environment variables

All set in the Vercel project (Project Settings → Environment Variables), **not** committed to git — GitHub's push-protection secret scanner will reject commits containing the Mapbox token (it's flagged as a high-confidence secret pattern even though it's a public `pk.` token), so don't try to commit a `.env` file with real values.

| Variable | Purpose | Targets set |
|---|---|---|
| `APP_PASSWORD` | The site password, checked in `/api/login` | production, preview |
| `AUTH_SECRET` | Random secret used to sign session tokens. Changing it invalidates all existing sessions | production, preview |
| `DATABASE_URL` | Neon Postgres connection string, set automatically by the Neon–Vercel integration (`src/lib/db.ts` also accepts `POSTGRES_URL`) | set by integration |
| `MAPBOX_TOKEN` | Mapbox **public** access token (`pk.…`), served only to authenticated sessions via `/api/map-config` | production, preview, development |

There's an older unused `NEXT_PUBLIC_MAPBOX_TOKEN` variable still in the Vercel project from an earlier version of the map (before the password gate existed, when the token was build-time-inlined and public). It's safe to delete; nothing reads it now. If it's still there, that old token value was exposed in public page source for a while and ideally should be rotated/restricted in the Mapbox dashboard.

To change any of these: update in Vercel, then trigger a new deployment (env var changes don't apply to already-built deployments — redeploy, e.g. via an empty commit or the Vercel dashboard's "Redeploy" button).

## Deliberate shortcuts (don't "fix" these without asking)

This is explicitly a for-fun project, not one following normal engineering practice. Known, intentional simplifications:

- No local `.env` file / no separate dev vs. prod config — everything reads from the same Vercel-managed env vars, and there's no documented local-dev setup.
- The only database is Neon Postgres, used for attendance sign-ups and the itinerary (`src/lib/db.ts`, `@neondatabase/serverless` over HTTP). There's no migration tooling: `db()` runs `CREATE TABLE/INDEX IF NOT EXISTS` on first use in each server instance, so new tables go there, but changes to an existing table's columns need a manual `ALTER TABLE` (e.g. in the Neon console). Trip-wide costs (`TRIP_COSTS`) are still static code. Auth is stateless (signed cookie); rate-limit counters are in-memory and volatile.
- No test suite.
- No `package-lock.json` committed — install with `npm install` before relying on exact pinned versions.
- Vercel Authentication (SSO protection) is turned **off** for this project (it was on by default and blocked the login page from working for anyone without a Vercel account).

## Working on this repo

- Framework preset in Vercel must be **Next.js** (it defaulted to "Other" once when the repo only had a README, which silently broke every deploy — worth checking if deploys start failing again for no obvious reason).
- `npm run build` requires `AUTH_SECRET`/`APP_PASSWORD`/`MAPBOX_TOKEN` to be set (even dummy values) to build cleanly, since they're read at import time in a couple of places. `DATABASE_URL` isn't needed to build: every page that reads the database is rendered per request (`connection()`), never at build time.
- `npm run lint` / `npx tsc --noEmit` before pushing. `tsc` needs the Next-generated route types (e.g. `LayoutProps`), so run it after a build.
- `AGENTS.md` (auto-generated/managed by `next dev`, not hand-written) documents Next.js version-specific behaviour that may differ from a coding agent's training data — read it before making framework-level changes.

## Possible next steps (discussed, not started)

- Swim spots / anchorages on the Route map: Navily (the obvious data source) has **no public API** — confirmed by web search, nothing beyond the consumer app/website exists. Leaning towards manually curating a short list of spots (name + coordinates) and adding them as a second marker type alongside the itinerary pins, rather than scraping Navily's site (likely against their ToS) or pulling in a heavier open-data source (OpenSeaMap etc.) for a hobby project.
- Home page is still an empty placeholder with no design direction agreed yet.
- Replace the placeholder itinerary times/costs with the real plan.
- An in-app editor for the itinerary (currently edited in the Neon console).

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: run ESLint
