# AgriSafe Intelligence

Farm-to-fork biosecurity dashboard built with React + Vite.

## Available Scripts

### `npm run dev`

Runs the app in development mode with hot module reloading.\
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### `npm run build`

Builds the app for production to the `dist` folder.

### `npm run preview`

Serves the production build locally for a final check before deploying.

## Structure

- `src/pages` — one file per routed page (Dashboard, Risk Timeline, Herd Records, Inspection Log, Compliance Reports, MRI Model Config, Pathogen Trends)
- `src/components` — reusable UI building blocks used across pages
- `src/routes.js` — route paths and per-page Topbar title/subtitle metadata
