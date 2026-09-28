# Greece 2027

A [Next.js](https://nextjs.org) app, deployed on [Vercel](https://vercel.com). Built with [Material UI](https://mui.com) and designed for phones only (max width 430px).

## Config

The Route page uses [Mapbox](https://www.mapbox.com) and reads its public access token (`pk.`) from `NEXT_PUBLIC_MAPBOX_TOKEN`. The token lives in the Vercel project's environment variables (Project Settings → Environment Variables), not in git. Changing it needs a redeploy, since the value is baked in at build time.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: run ESLint

## Deploying

Every push to `main` deploys to production on Vercel, and every other branch gets a preview URL. The Vercel project's Framework Preset must be **Next.js** (Project Settings → Build & Development).
