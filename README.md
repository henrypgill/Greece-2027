# Greece 2027

A [Next.js](https://nextjs.org) app, deployed on [Vercel](https://vercel.com). Built with [Material UI](https://mui.com) and designed for phones only (max width 430px).

## Access

The whole site sits behind a password. `src/proxy.ts` blocks every request that doesn't carry a valid session cookie, except the login page and its API.

- Signing in (`POST /api/login`) sets an httpOnly cookie holding a signed token that is valid for 2 hours.
- After 5 wrong passwords from the same IP address, that IP is blocked for 2 hours. Counters are kept in memory, so they are per server instance and reset if the instance is recycled.
- The Mapbox token is only served by `/api/map-config` to signed-in sessions.

## Config

Set these in the Vercel project's environment variables (Project Settings → Environment Variables). Changing them needs a redeploy.

- `APP_PASSWORD`: the password for the site
- `AUTH_SECRET`: long random string used to sign session tokens (changing it signs everyone out)
- `MAPBOX_TOKEN`: Mapbox public access token (`pk.`) for the Route page

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: run ESLint

## Deploying

Every push to `main` deploys to production on Vercel, and every other branch gets a preview URL. The Vercel project's Framework Preset must be **Next.js** (Project Settings → Build & Development).
