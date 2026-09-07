# Dimes War Room

Donnie Dimes in-season tool for Hogg Heaven. Static React app (built with esbuild) plus two Vercel serverless functions.

```
api/vegas.js     Vegas lines and player props from The Odds API, normalized for the app
api/coach.js     Coach proxy to Anthropic (only if ANTHROPIC_API_KEY is set)
src/app.jsx      the whole app, data baked in (regenerated each week from the project files)
src/entry.jsx    mounts the app
public/          index.html, icons, manifest; public/app.js is built, not committed
```

## Deploy (GitHub -> Vercel)

1. Push this folder to a GitHub repo.
2. Vercel: Add New Project, import the repo. Framework: Other. Build command and output directory come from vercel.json (`npm run build`, `public`).
3. Project Settings -> Environment Variables:
   - `ODDS_API_KEY` = your the-odds-api.com key (required for the Vegas board)
   - `ANTHROPIC_API_KEY` = optional, enables Coach on the web. Coach always works inside the Claude app.
4. Deploy. Every push to main redeploys.

## Weekly update

Replace `src/app.jsx` with the new build (it carries the latest projections, rosters and weekly sources), commit, push. That is the whole update.

## Local

```
npm install
npm run dev      # http://localhost:3000, API routes need `vercel dev` instead
```
