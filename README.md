# Greece 2027

A trip-planning app for a Greek island hopping trip, June 2027. A [Next.js](https://nextjs.org) app (App Router, TypeScript), deployed on [Vercel](https://vercel.com). Built with [Material UI](https://mui.com) v9. This is a hobby project, not production software \u2014 practices are deliberately kept simple (see "Deliberate shortcuts" below).

## Live site

- **URL:** https://greece-2027.vercel.app
- **Vercel project:** `greece-2027`, team `henrys-projects-7405eafb` (team ID `team_sOOQA1KcoJcZPenMHoEsBZHd`)
- **GitHub repo:** `henrypgill/Greece-2027`, default branch `main`
- The whole site is password-protected (see "Password gate" below). **Current password: `borradaile`.**
- Every push to `main` auto-deploys to production via the Vercel\u2013GitHub integration. There is no staging environment or CI \u2014 pushing to `main` is the only deploy path.

## Pages

Phone-only layout, capped at 430px wide (upper bound of common phone widths), centred with a grey background on anything wider. A burger menu in the top `AppBar` opens a `Drawer` with the three routes below (`src/components/AppShell.tsx`). The login page (`/login`) is the only page with no shell around it.

- `/` \u2014 Home. Empty (`src/app/page.tsx`).
- `/route` \u2014 A full-page Mapbox map (`src/components/RouteMap.tsx`) showing 5 markers (Paros, Sifnos, Mykonos, Santorini, Naxos), defined in `src/data/route-stops.ts`. Opens zoomed to fit all markers. Tapping a marker shows its name.
- `/itinerary` \u2014 Empty (`src/app/itinerary/page.tsx`).

## Password gate

The whole site requires a password, added because the Mapbox token and trip details shouldn't be public. Full design rationale is in the conversation history, not written down elsewhere \u2014 summary:

- `src/proxy.ts` (Next.js Proxy, formerly "Middleware") blocks every request without a valid session cookie, except `/login` and `POST /api/login`.
- `POST /api/login` (`src/app/api/login/route.ts`) checks the password against `APP_PASSWORD` and, if correct, sets an httpOnly cookie (`session`) containing a signed token (`src/lib/auth.ts`, HMAC-SHA256 via Web Crypto, secret is `AUTH_SECRET`). Token format: `<expiry-ms>.<signature>`. Valid for 2 hours (`SESSION_TTL_SECONDS`).
- Failed logins are rate-limited per client IP (`src/lib/rate-limit.ts`): 5 wrong attempts blocks that IP for 2 hours. **Limiter state is an in-memory `Map`**, so it's per server instance and resets on redeploy or cold start \u2014 acceptable for deterring casual brute-forcing of a hobby app's password, not a hard guarantee.
- The Mapbox token is never sent to the browser as part of the JS bundle. `RouteMap.tsx` fetches it at runtime from `GET /api/map-config` (`src/app/api/map-config/route.ts`), which only returns it to a request carrying a valid session cookie.
- Client IP is read from `x-forwarded-for`, which Vercel sets itself (not client-controlled), so it can't be spoofed on this platform.

## Environment variables

All set in the Vercel project (Project Settings \u2192 Environment Variables), **not** committed to git \u2014 GitHub's push-protection secret scanner will reject commits containing the Mapbox token (it's flagged as a high-confidence secret pattern even though it's a public `pk.` token), so don't try to commit a `.env` file with real values.

| Variable | Purpose | Targets set |
|---|---|---|
| `APP_PASSWORD` | The site password, checked in `/api/login` | production, preview |
| `AUTH_SECRET` | Random secret used to sign session tokens. Changing it invalidates all existing sessions | production, preview |
| `MAPBOX_TOKEN` | Mapbox **public** access token (`pk.\u2026`), served only to authenticated sessions via `/api/map-config` | production, preview, development |

There's an older unused `NEXT_PUBLIC_MAPBOX_TOKEN` variable still in the Vercel project from an earlier version of the map (before the password gate existed, when the token was build-time-inlined and public). It's safe to delete; nothing reads it now. If it's still there, that old token value was exposed in public page source for a while and ideally should be rotated/restricted in the Mapbox dashboard.

To change any of these: update in Vercel, then trigger a new deployment (env var changes don't apply to already-built deployments \u2014 redeploy, e.g. via an empty commit or the Vercel dashboard's "Redeploy" button).

## Deliberate shortcuts (don't "fix" these without asking)

This is explicitly a for-fun project, not one following normal engineering practice. Known, intentional simplifications:

- No local `.env` file / no separate dev vs. prod config \u2014 everything reads from the same Vercel-managed env vars, and there's no documented local-dev setup.
- No database. Auth is stateless (signed cookie); rate-limit counters are in-memory and volatile.
- No test suite.
- No `package-lock.json` committed \u2014 install with `npm install` before relying on exact pinned versions.
- Vercel Authentication (SSO protection) is turned **off** for this project (it was on by default and blocked the login page from working for anyone without a Vercel account).

## Working on this repo

- Framework preset in Vercel must be **Next.js** (it defaulted to "Other" once when the repo only had a README, which silently broke every deploy \u2014 worth checking if deploys start failing again for no obvious reason).
- `npm run build` requires `AUTH_SECRET`/`APP_PASSWORD`/`MAPBOX_TOKEN` to be set (even dummy values) to build cleanly, since they're read at import time in a couple of places.
- `npm run lint` / `npx tsc --noEmit` before pushing.
- `AGENTS.md` (auto-generated/managed by `next dev`, not hand-written) documents Next.js version-specific behaviour that may differ from a coding agent's training data \u2014 read it before making framework-level changes.

## Possible next steps (discussed, not started)

- Swim spots / anchorages on the Route map: Navily (the obvious data source) has **no public API** \u2014 confirmed by web search, nothing beyond the consumer app/website exists. Leaning towards manually curating a short list of spots (name + coordinates) and adding them to `route-stops.ts` as a second marker type, rather than scraping Navily's site (likely against their ToS) or pulling in a heavier open-data source (OpenSeaMap etc.) for a hobby project.
- Itinerary and Home pages are still empty placeholders with no design direction agreed yet.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: run ESLint
