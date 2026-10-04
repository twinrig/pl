# Play Log

Laptop app for logging football plays. One game at a time, kept for a whole season.

The screen, season, and roster code is in `src/components/play-book.tsx`. Play sentences are in `src/lib/plays.ts`.

## Run it with no internet

Open `public/Play-Log.html` in a browser. Save that file and double-click it. Games stay in the browser for that file.

## Work on the source

```bash
npm install
npm run dev
```

The preview is at http://127.0.0.1:8080/

Build a new offline file:

```bash
npx vite build --config scripts/vite.local.config.ts
```

Then pack `artifacts/play-log-build/app.css` and `app.js` into one HTML file and replace `public/Play-Log.html`.
