# Greece 2027

A [Next.js](https://nextjs.org) app, deployed on [Vercel](https://vercel.com). Built with [Material UI](https://mui.com) and designed for phones only (max width 430px).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Start editing at `src/app/page.tsx`.

## Config

There is a single `.env` file, committed to git and used for both local and production. It only holds public values, such as the Mapbox public access token (`pk.`) used by the Route page. Never put secret keys (`sk.`) in it.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: run ESLint

## Deploying

Every push to `main` deploys to production on Vercel, and every other branch gets a preview URL. The Vercel project's Framework Preset must be **Next.js** (Project Settings → Build & Development).
