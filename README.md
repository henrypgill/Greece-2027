# Greece 2027

A trip-planning app for a Greek island-hopping boat trip, July 2027. A [Next.js](https://nextjs.org) app (App Router, TypeScript), deployed on [Vercel](https://vercel.com). Built with [Material UI](https://mui.com) v9. This is a hobby project, not production software — practices are deliberately kept simple (see "Deliberate shortcuts" below).

## Live site

- **URL:** https://greece-2027.vercel.app
- **Vercel project:** `greece-2027`, team `henrys-projects-7405eafb` (team ID `team_sOOQA1KcoJcZPenMHoEsBZHd`)
- **GitHub repo:** `henrypgill/Greece-2027`, default branch `main`
- The whole site is password-protected, with a user password and an admin password (see "Password gate" below). The passwords are only in the Vercel env vars, deliberately not written here, because this repo is public.
- Every push to `main` auto-deploys to production via the Vercel–GitHub integration. There is no staging environment or CI — pushing to `main` is the only deploy path.

## Pages

Phone-only layout, capped at 430px wide (upper bound of common phone widths), centred with a grey background on anything wider. A burger menu in the top `AppBar` opens a `Drawer` with the six routes below plus "Log out" (`src/components/AppShell.tsx`), which is also how to switch between the user and admin password. The login page (`/login`) is the only page with no shell around it.

- `/` — Home (`src/app/page.tsx`): a short trip description at the top (markdown, stored as `trip_description` in the `settings` table, starting text `TRIP_DESCRIPTION` in `db.ts`; when that text changes, a one-off seed (currently `trip-description-v3`) swaps it in if the stored text is still one of the earlier starting texts, so admin edits are never overwritten; admins edit it with a pencil next to it, `TripDescription.tsx` and `saveTripDescription` in `src/app/actions.ts`), then the cost per person (same `costPerPerson()` as the Costs page, with a link there), then the trip's first and last day and its length in days, then a month calendar (`src/components/TripCalendar.tsx`, a plain grid, weeks starting Monday, no date library) with the trip days highlighted. The dates come from the itinerary: the earliest stop start to the latest stop end, as Greek-time calendar days (`greekDayKey()`), so they follow edits to the itinerary. Last, "Likely weather" (`src/components/TripWeather.tsx`): typical mid-to-late July figures for the Cyclades (day and night temperatures, sea temperature, hours of sunshine), researched in September 2026 and hard-coded; it's long-term averages, not a forecast, and doesn't follow edits to the dates.
- `/route` — A full-page Mapbox map (`src/components/RouteMap.tsx`) showing every itinerary item as a numbered pin coloured by stop type (see below; a small key shows the types in use), in itinerary order, with a straight line between consecutive items and an arrowhead at each line's midpoint showing direction. Opens zoomed to fit all pins. Tapping a pin opens a full-screen popup of that stop (`src/components/StopPopup.tsx`, an MUI `Dialog` kept inside the page area like the menu drawer) with everything but its costs, via the same `StopDetails` component the Itinerary page uses.
- `/itinerary` — An expandable list (MUI `Accordion`) of itinerary items (`src/app/itinerary/page.tsx` loads the data and the role; `ItineraryList.tsx` renders it). Row header: number (coloured by stop type, like the map pins) + title. Expanded: start → end (always shown in Greek time, `Europe/Athens`), the stop type, admin notes (admins only, see below), a photo carousel if the stop has photos (`src/components/ImageCarousel.tsx`: a swipeable scroll-snap strip with arrows and dots; plain `<img>` tags because the photos are links to images hosted anywhere, not uploads), markdown description (`react-markdown`), optional "Open in Google Maps" button, and the travel time to the next item (all in `src/components/StopDetails.tsx`, shared with the Route map's popup). Costs are deliberately not shown here. **Admins also get:**
  - A pencil button on each expanded stop, opening a popup (`StopDialog.tsx`) with every field (including the stop type and admin notes) plus cost lines (each with its own per person/shared switch) and photo URLs (with a small preview); Save saves, Delete deletes. An "Add stop" button at the top opens the same popup empty (new stops go at the end). Times are entered as Greek local time (`datetime-local`) and converted in SQL (`::timestamp AT TIME ZONE 'Europe/Athens'`). Saving replaces the stop's cost lines and photos in the same statement.
  - A drag handle on each row (`@dnd-kit/sortable`, vertical only). Dropping saves the new order straight away (`reorderStops`: renumbers every `sort_order` 10, 20, 30… in one statement, and refuses if the list of ids no longer matches the database, e.g. someone else added a stop meanwhile). The list moves immediately and snaps back with an error message if saving fails.
  - All of these are Server Actions (`src/app/itinerary/actions.ts`) that check for an admin session themselves, validate server-side, and `revalidatePath('/', 'layout')`.
- `/costs` — Per-person cost at the top (`TripTotal.tsx`, `costPerPerson()` in `src/data/itinerary.ts`): every cost, overall and per stop, is either per person (counted as it is) or shared (split equally between the number of people), with the whole-group total and the number of people underneath. The number of people is set by an admin (pencil next to it) and stored as `people_count` in the `settings` key/value table (`src/lib/settings-db.ts`; every key's starting value is inserted in `db.ts`, this one 10); it is deliberately not derived from attendance sign-ups. Then "Overall trip costs" (costs for the whole trip rather than one stop: flights, charter, etc., stored in the `trip_costs` table; `TripCosts.tsx`). Each is either **per person** (the amount each person pays, e.g. flights) or **shared** (the amount for the whole group, split between everyone, e.g. the charter), shown under its amount, with each person's share for shared ones (`costShareLabel()`); the subtotal is for the whole group (`costForGroup()`), then a day-by-day breakdown of itinerary item costs (shown the same way, each with a whole-group day total), grouped by the Greek-time day each item starts (`src/app/costs/page.tsx`). Admins get an "Add cost" button and a pencil on each overall cost, opening a popup with name, amount, an optional description (shown under the name) and a per person/shared switch (plus Delete); new costs go at the end. These are Server Actions in `src/app/costs/actions.ts` that check for an admin session themselves. Day-by-day costs are edited on the itinerary stops instead.
- `/bring` — "Things to bring": a list of items, each with an optional note (`src/app/bring/`, stored in the `bring_items` table, `src/lib/bring-db.ts`). It started with a few boat-trip basics (seed `bring-items-v1`). Admins get "Add item" and a pencil on each item, opening a popup with the item and note (plus Delete); new items go at the end. Server Actions in `actions.ts`, admin-checked like the others.
- `/attendance` — "I'm going" form (first + last name, both required) and the list of everyone who's signed up, in sign-up order (`src/app/attendance/`). Submits via a Server Action (`actions.ts`), which re-checks the session cookie itself since Server Actions can be POSTed to directly. Names are unique case-insensitively, so signing up twice just says you're already on the list. No emails are collected. Admins get edit (pencil → popup) and remove buttons on each name (`AttendeeList.tsx`, `updateAttendee`/`removeAttendee` in `actions.ts`, which check for an admin session themselves). Renaming someone to a name already on the list is refused.

## Itinerary data

The itinerary lives in Neon Postgres, in three tables:

- `itinerary_items`: `sort_order` (display order; ties broken by `id`, gaps fine — seeded as 10, 20, 30…), `title`, `start_at`/`end_at` (`timestamptz`, `end_at >= start_at`), `description` (markdown), `lat`/`lng` (required, where the map pin goes), `google_maps_url` (nullable), `stop_type` (one of the `STOP_TYPES` keys in `src/data/itinerary.ts`: `docked_power` green, `docked` red, `anchor` purple, `buoy` yellow, `swim` orange; default `docked`), `admin_notes` (text, default empty). Both added later with `ADD COLUMN IF NOT EXISTS`; a one-off seed (`stop-types-v1`) set existing stops' types from the older `shore_power` column (now unused) and "anchor"/"swim" in their titles.

**Admin notes are admin-only data, not just hidden UI:** `getItinerary()` only includes them when called with `includeAdminNotes: true`, which the Itinerary and Route pages pass only for admin sessions, so they never reach a non-admin's browser. Any new page that sends itinerary items to the client must do the same.
- `itinerary_costs`: `item_id` (→ `itinerary_items.id`, cascade delete), `sort_order`, `item`, `cost` (`numeric(10,2)`, GBP, set by `CURRENCY` in `src/data/itinerary.ts`; switched from EUR while the amounts were still placeholders, and stored amounts weren't converted), `per_person` (boolean, default shared; added later with `ADD COLUMN IF NOT EXISTS`).
- `itinerary_images`: `item_id` (→ `itinerary_items.id`, cascade delete), `sort_order`, `url` (a link to a photo hosted elsewhere).

Overall trip costs are in a third table, `trip_costs` (`sort_order`, `item`, `cost`, `per_person`, `description`; the last two added later with `ADD COLUMN IF NOT EXISTS`), loaded by `getTripCosts()` in `src/lib/trip-costs-db.ts`. It was seeded once (seed name `trip-costs-v1`) from `TRIP_COSTS_SEED` in `src/data/trip-costs.ts` with placeholder Flights (per person) and Yacht charter (shared) at £0; editing the seed now has no effect. `per_person` was added later: `db.ts` adds it with `ADD COLUMN IF NOT EXISTS` (default shared), and a one-off seed (`trip-costs-flights-per-person`) marked the existing Flights row per person.

`getItinerary()` in `src/lib/itinerary-db.ts` loads it (items in order, each with its costs and photos) as the `ItineraryItem[]` shape defined in `src/data/itinerary.ts`, which also holds the helpers (`getLegs`, `groupByDay`, formatting) and has no server-only imports so client components can use it. The Itinerary, Route and Costs pages all load it per request (`connection()`); the Route page passes it to the client-side `RouteMap` as a prop. Pages show an error message if the database can't be reached. **Order is the trip order** and drives the pin numbers and arrows.

Travel time between items isn't stored; it's derived as the gap between one item's `end` and the next item's `start` (`getLegs()`).

**Seeding:** the tables were first filled from `src/data/itinerary-seed.ts`. This happens exactly once per database, tracked by the row `itinerary-v1` in the `seeds` table, in a single atomic statement, so concurrent server instances can't double-seed and deleting every item won't bring the seed back. Editing the seed file now has no effect. Edit the itinerary in the app as an admin on `/itinerary` (or directly in the Neon console, entering times with an offset, e.g. `2027-07-16 15:00+03`). The seeded data had real route/dates but placeholder times for most stops and all end times, empty costs, and an approximate Liems cove pin (Ios island centre).

## Password gate

The whole site requires a password, added because the Mapbox token and trip details shouldn't be public. There are two passwords, giving two roles:

- **User** (`USER_PASSWORD`): the site as a visitor, plus signing up on the attendance page.
- **Admin** (`ADMIN_PASSWORD`): everything a user can do, plus editing/reordering/adding/deleting itinerary stops and editing/removing attendees.

How it works:

- `src/proxy.ts` (Next.js Proxy, formerly "Middleware") blocks every request without a valid session cookie (either role), except `/login`, `POST /api/login` and `POST /api/logout`.
- `POST /api/login` (`src/app/api/login/route.ts`) checks the password against `ADMIN_PASSWORD` and `USER_PASSWORD` and, if one matches, sets an httpOnly cookie (`session`) containing a signed token (`src/lib/auth.ts`, HMAC-SHA256 via Web Crypto, secret is `AUTH_SECRET`). Token format: `<role>.<expiry-ms>.<signature of role.expiry>`, so the role can't be changed without breaking the signature. Valid for 2 hours (`SESSION_TTL_SECONDS`). `POST /api/logout` deletes the cookie.
- If `USER_PASSWORD`, `ADMIN_PASSWORD` or `AUTH_SECRET` is missing, `/api/login` returns `not_configured` for every password (right or wrong), and the login page says "Login isn't set up on the server yet". Add the missing variable in Vercel and redeploy.
- Admin-only things are enforced on the server, in each Server Action (`isAdminSession()` in `src/lib/session.ts`); the pages only use the role to decide whether to show the admin controls.
- Failed logins are rate-limited per client IP (`src/lib/rate-limit.ts`): 5 wrong attempts blocks that IP for 2 hours. **Limiter state is an in-memory `Map`**, so it's per server instance and resets on redeploy or cold start — acceptable for deterring casual brute-forcing of a hobby app's password, not a hard guarantee.
- The Mapbox token is never sent to the browser as part of the JS bundle. `RouteMap.tsx` fetches it at runtime from `GET /api/map-config` (`src/app/api/map-config/route.ts`), which only returns it to a request carrying a valid session cookie.
- Client IP is read from `x-forwarded-for`, which Vercel sets itself (not client-controlled), so it can't be spoofed on this platform.

## Environment variables

All set in the Vercel project (Project Settings → Environment Variables), **not** committed to git — GitHub's push-protection secret scanner will reject commits containing the Mapbox token (it's flagged as a high-confidence secret pattern even though it's a public `pk.` token), so don't try to commit a `.env` file with real values.

| Variable | Purpose | Targets set |
|---|---|---|
| `USER_PASSWORD` | The user password, checked in `/api/login` | production, preview |
| `ADMIN_PASSWORD` | The admin password, checked in `/api/login` | production, preview |
| `AUTH_SECRET` | Random secret used to sign session tokens. Changing it invalidates all existing sessions | production, preview |
| `DATABASE_URL` | Neon Postgres connection string, set automatically by the Neon–Vercel integration (`src/lib/db.ts` also accepts `POSTGRES_URL`) | set by integration |
| `MAPBOX_TOKEN` | Mapbox **public** access token (`pk.…`), served only to authenticated sessions via `/api/map-config` | production, preview, development |

There's an older unused `NEXT_PUBLIC_MAPBOX_TOKEN` variable still in the Vercel project from an earlier version of the map (before the password gate existed, when the token was build-time-inlined and public). It's safe to delete; nothing reads it now. If it's still there, that old token value was exposed in public page source for a while and ideally should be rotated/restricted in the Mapbox dashboard.

To change any of these: update in Vercel, then trigger a new deployment (env var changes don't apply to already-built deployments — redeploy, e.g. via an empty commit or the Vercel dashboard's "Redeploy" button).

## Deliberate shortcuts (don't "fix" these without asking)

This is explicitly a for-fun project, not one following normal engineering practice. Known, intentional simplifications:

- No local `.env` file / no separate dev vs. prod config — everything reads from the same Vercel-managed env vars, and there's no documented local-dev setup.
- The only database is Neon Postgres, used for attendance sign-ups and the itinerary (`src/lib/db.ts`, `@neondatabase/serverless` over HTTP). There's no migration tooling: `db()` runs `CREATE TABLE/INDEX IF NOT EXISTS` on first use in each server instance, so new tables go there; new columns on an existing table can be added there too with `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (as for `trip_costs.per_person`), but other changes need a manual `ALTER TABLE` (e.g. in the Neon console). Auth is stateless (signed cookie); rate-limit counters are in-memory and volatile.
- No test suite.
- No `package-lock.json` committed — install with `npm install` before relying on exact pinned versions.
- Vercel Authentication (SSO protection) is turned **off** for this project (it was on by default and blocked the login page from working for anyone without a Vercel account).

## Working on this repo

- **Commit and push straight to `main`. Don't create branches or pull requests.** This is a hobby project, not production software: downtime or a briefly broken deploy doesn't matter, and every push to `main` redeploys. If a change needs env vars set in Vercel, say so, but still push to `main`.
- Framework preset in Vercel must be **Next.js** (it defaulted to "Other" once when the repo only had a README, which silently broke every deploy — worth checking if deploys start failing again for no obvious reason).
- `npm run build` requires `AUTH_SECRET`/`USER_PASSWORD`/`ADMIN_PASSWORD`/`MAPBOX_TOKEN` to be set (even dummy values) to build cleanly, since they're read at import time in a couple of places. `DATABASE_URL` isn't needed to build: every page that reads the database is rendered per request (`connection()`), never at build time.
- `npm run lint` / `npx tsc --noEmit` before pushing. `tsc` needs the Next-generated route types (e.g. `LayoutProps`), so run it after a build.
- `AGENTS.md`: the `nextjs-agent-rules` block is auto-generated/managed by `next dev` (not hand-written) and documents Next.js version-specific behaviour that may differ from a coding agent's training data — read it before making framework-level changes. The "Branching" section below that block is hand-written.

## Possible next steps (discussed, not started)

- Swim spots / anchorages on the Route map: Navily (the obvious data source) has **no public API** — confirmed by web search, nothing beyond the consumer app/website exists. Leaning towards manually curating a short list of spots (name + coordinates) and adding them as a second marker type alongside the itinerary pins, rather than scraping Navily's site (likely against their ToS) or pulling in a heavier open-data source (OpenSeaMap etc.) for a hobby project.
- Replace the placeholder itinerary times/costs with the real plan.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: run ESLint
