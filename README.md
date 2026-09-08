# AgriSafe Intelligence

Farm-to-fork agricultural biosecurity platform for farmers and agricultural researchers — a React/Vite frontend with an Express + PostgreSQL backend (uploaded documents in Google Cloud Storage) equipped with real authentication, AI risk-investigation agent with reasoning and recommendations, and autonomous email loops for risk warnings and audit report reminders.

## Quick Start

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL, GCS_*, GROQ_API_KEY and SMTP_* (see below)
npm run db:up              # starts a local Postgres in Docker
npm run db:migrate         # applies the schema
npm run dev                # runs the frontend (Vite) + API server together
```

Website: https://philmak999.github.io/AgriSafe-Intelligence/login 
Or locally:
Open [http://localhost:5173](http://localhost:5173).

### Test accounts

Two accounts are pre-seeded so you can see both sides of the app immediately:

| Username | Password | Role | What you'll see |
|---|---|---|---|
| `admin` | `admin` | AgriSafe Scientist (staff) | Full Access: full corridor data, MRI Model Config, Pathogen Trends, Automation Log, Farmer Approvals |
| `farmer` | `farmer` | Farmer | Registered farm (Example: Seneca Valley Farms): Dashboard, Risk Timeline, Herd Records, Inspection Log, Compliance Reports |

```bash
node server/seedTestAccounts.js
```

## Features

### Core biosecurity dashboards
- **Dashboard** — role-gated dashboard: scientists see corridor-wide MRI trends, biosecurity gauge, risk flags, and an inspection queue; farmers see their own farm's MRI score, risk level, vaccination coverage, and a corridor percentile comparison
- **Risk Timeline** — chronological feed of biosecurity risk events across the corridor
- **Herd Records** — searchable registry of every herd (species, head count, vaccination rate, MRI score, risk level)
- **Inspection Log** — recent + full inspection history with pathogen screen results
- **Compliance Reports** — regulatory filing status (FSMA 204, CFIA Part 11, USDA FSIS)

### Scientist-only tools
- **MRI Model Config** — live-adjustable sub-index weights (vaccination, antibiotics, herd density, outbreak proximity) with a real-time gauge preview
- **Pathogen Trends** — monthly detection trends + frequency breakdown by pathogen
- **Risk Investigation Agent** — click "Investigate →" on any flagged farm to run a real Groq-powered tool-calling AI agent that pulls the herd record, risk timeline, inspection history, and compliance status, then returns a structured summary/findings/recommendation
- **Automation Log** — a fully autonomous loop (starts with the server, runs on its own) that:
  - **Sources** newly-flagged (HIGH/MED risk) farms from live risk data
  - **Follows up** by running the Investigation Agent and emailing the findings to an ops inbox
  - **Tracks** every farm's status/history in a persistent store, with a cooldown so it doesn't re-notify every cycle
  - **Reports** a live dashboard of tracked items + run history, plus a manual "Run cycle now" button

### Farmer accounts & self-service
- **Farmer registration** — real signup with username + password (bcrypt-hashed), farm selection, and a required ownership-verification step:
  - **Herd ID match** — must match the exact ID on file for the selected farm
  - **Ownership document upload** — a deed, lease, government Premises ID letter, or inspection report (PDF/PNG/JPG/WEBP)
  - Account stays inactive until an AgriSafe staff member reviews and approves it
- **Farmer Approvals** (staff-only) — review queue showing each pending registration, a link to the uploaded document, and Approve/Reject actions (with email notification either way)
- **Farmer notification loop** — a second autonomous daily loop, independent of the risk-automation one:
  - **Reminders** — emails a farmer when an inspection or compliance filing is due soon or overdue (14-day window, 3-day cooldown by default)
  - **Weekly reports** — a full farm snapshot (risk level, MRI, vaccination, last/next inspection, compliance status, recent activity) emailed every Monday by default
- **Remove registration** — staff can revoke/delete a farmer account at any time, freeing the farm to be re-registered

### Access control & data scoping
- Real authentication — hashed passwords, JWT session cookies, server-enforced role checks (not just hidden nav items)
- Farmers only ever see their own farm's specific details across every page; a **corridor percentile** stat lets them compare performance without exposing any other farm's data
- Every internal ops tool (Investigation Agent, Automation Log, Farmer Approvals) returns a real 403 if a farmer session hits it directly

## Environment Variables

See `.env.example` for the full list with explanations. At minimum for local dev:

- `DATABASE_URL` — Postgres connection string; the default value matches `npm run db:up`'s local Docker container as-is
- `GCS_PROJECT_ID` / `GCS_BUCKET_NAME` / `GCS_KEY_JSON_BASE64` — a Google Cloud Storage bucket + service-account key for storing farmer ownership documents; see `.env.example` for setup steps
- `GROQ_API_KEY` — free key from [console.groq.com/keys](https://console.groq.com/keys), powers the Investigation Agent
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — needed for real emails (reminders, weekly reports, approval notices); Gmail App Passwords work well for this — see `.env.example` for setup steps
- `JWT_SECRET` — random string signing login sessions; generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Everything else (loop intervals, reminder windows, seed account credentials) has a sensible default.

## Available Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Runs the Vite frontend and the Express API server together |
| `npm run dev:web` | Frontend only |
| `npm run dev:api` | API server only (auto-restarts on file changes) |
| `npm run build` | Builds the frontend for production to `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | ESLint over `src/` and `server/` |
| `npm run test` | Runs the Vitest suite in watch mode |
| `npm run test:run` | Runs the Vitest suite once (used in CI) |
| `npm run db:up` | Starts a local Postgres container (Docker Compose) |
| `npm run db:down` | Stops the local Postgres container |
| `npm run db:migrate` | Applies any pending SQL migrations to `DATABASE_URL` (also runs automatically before `npm start`) |
| `node server/seedTestAccounts.js` | (Re-)creates the `admin`/`admin` and `farmer`/`farmer` test accounts |

## CI/CD

- **[ci.yml](.github/workflows/ci.yml)** — runs on every pull request and every push to a non-`main` branch: spins up a Postgres service container, then `npm ci` → lint → migrate → test → build. Nothing merges into `main` without passing this (enforce with a branch protection rule requiring the `build` check).
- **[deploy-pages.yml](.github/workflows/deploy-pages.yml)** — runs on push to `main`: repeats the same Postgres + lint/migrate/test/build gate, publishes `dist/` to GitHub Pages, then does a best-effort health check against the deployed backend (`API_BASE_URL` repo variable + `/api/health`, which now also checks DB connectivity) so a broken deploy shows up in the Actions tab instead of a support email.
- **Backend** — deployed by Render via its own git integration, using [render.yaml](render.yaml) as the source of truth. `npm start`'s `prestart` hook applies pending migrations against Cloud SQL on every deploy. Render also polls `/api/health` itself for zero-downtime rollouts.
- **[dependabot.yml](.github/dependabot.yml)** — weekly PRs for outdated/vulnerable npm and GitHub Actions dependencies.

Repo variables to set (Settings → Secrets and variables → Actions → Variables): `VITE_API_BASE_URL` (required, used by the frontend build) and `API_BASE_URL` (optional, same value without the `VITE_` prefix, enables the post-deploy health check).

## Structure

- `src/pages` — one file per routed page
- `src/components` — reusable UI building blocks
- `src/data/mockData.js` — shared mock dataset (herds, risk flags, inspections, compliance reports) — static fixture data, not persisted state; single source of truth for both the UI and the backend agent/automation tools
- `src/AuthContext.jsx` — frontend session state (current user, login/logout)
- `src/routes.js` — route paths and per-page Topbar title/subtitle metadata
- `server/` — Express API: authentication, the Investigation Agent, the two autonomous loops, and farmer registration/approval
- `server/db/` — Postgres connection pool, hand-written SQL migrations, and the migration runner (`npm run db:migrate`)
- `server/gcs.js` — Google Cloud Storage upload/signed-URL/delete helpers for farmer ownership documents
- `server/staffStore.js`, `server/farmerStore.js`, `server/store.js` — the three persisted-data stores (staff accounts, farmer accounts, automation records/history/runs), all backed by Postgres via `server/db/pool.js`
