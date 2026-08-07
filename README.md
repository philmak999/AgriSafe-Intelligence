# AgriSafe Intelligence

Farm-to-fork biosecurity platform for the Ontario + NYS corridor — a React/Vite frontend with an Express + SQLite-free (JSON file store) backend, real authentication, an AI risk-investigation agent, and two autonomous email loops.

## Quick Start

```bash
npm install
cp .env.example .env      # then fill in GROQ_API_KEY and SMTP_* (see below)
npm run dev                # runs the frontend (Vite) + API server together
```

Open [http://localhost:5173](http://localhost:5173).

### Test accounts

Two accounts are pre-seeded so you can see both sides of the app immediately:

| Username | Password | Role | What you'll see |
|---|---|---|---|
| `admin` | `admin` | AgriSafe Scientist (staff) | Everything — full corridor data, MRI Model Config, Pathogen Trends, Automation Log, Farmer Approvals |
| `farmer` | `farmer` | Farmer | Only their own farm ("Seneca Valley Farms") — Dashboard, Risk Timeline, Herd Records, Inspection Log, Compliance Reports |

If you ever wipe local data (`server/data/`), re-create both with:

```bash
node server/seedTestAccounts.js
```

## Features

### Core biosecurity dashboards
- **Dashboard** — role-aware home page; scientists see corridor-wide MRI trends, biosecurity gauge, risk flags, and an inspection queue; farmers see their own MRI score, risk level, vaccination coverage, and a corridor percentile comparison
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
| `node server/seedTestAccounts.js` | (Re-)creates the `admin`/`admin` and `farmer`/`farmer` test accounts |

## Structure

- `src/pages` — one file per routed page
- `src/components` — reusable UI building blocks
- `src/data/mockData.js` — shared mock dataset (herds, risk flags, inspections, compliance reports) — single source of truth for both the UI and the backend agent/automation tools
- `src/AuthContext.jsx` — frontend session state (current user, login/logout)
- `src/routes.js` — route paths and per-page Topbar title/subtitle metadata
- `server/` — Express API: authentication, the Investigation Agent, the two autonomous loops, and farmer registration/approval
- `server/data/` — local JSON file stores (farmers, staff, automation history, uploaded documents) — gitignored, generated at runtime
