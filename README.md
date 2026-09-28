# Greece 2027

A [Next.js](https://nextjs.org) app, deployed on [Vercel](https://vercel.com). Built with [Material UI](https://mui.com) and designed for phones only (max width 430px).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Start editing at `src/app/page.tsx`.

## Environment variables

The Route page uses [Mapbox](https://www.mapbox.com). Set your Mapbox **public** access token (starts with `pk.`):

- Locally: add `NEXT_PUBLIC_MAPBOX_TOKEN=pk...` to `.env.local`
- On Vercel: add `NEXT_PUBLIC_MAPBOX_TOKEN` in Project Settings → Environment Variables, then redeploy (the value is baked in at build time)

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: run ESLint

## Deploying

Every push to `main` deploys to production on Vercel, and every other branch gets a preview URL. The Vercel project's Framework Preset must be **Next.js** (Project Settings → Build & Development).
