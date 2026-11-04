# Spec: Initial app structure

## Goal
Set up the minimal project skeleton: an Express server connected to MySQL and a React app (Vite) with client routing and Tailwind CSS, wired together for development and production, with environment configuration and a single command to run both. No business features.

## Structure
```
portfolio/
├── .gitignore            # node_modules, server/.env, server/www
├── package.json          # root scripts: runs server + app together
├── server/
│   ├── package.json
│   ├── index.js          # Express app
│   ├── db.js             # MySQL connection pool (mysql2)
│   ├── .env              # local values (not committed)
│   ├── .env.example      # template (committed)
│   └── www/              # static files served by Express (React build output)
└── app/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── index.css     # Tailwind entry
        └── main.jsx      # router + "Hello World" component
```

## Environment (`server/.env`, `server/.env.example`)
Both files contain:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=portfolio_ai
NODE_ENV=development
```

- `.env` is ignored by git; `.env.example` is committed as the template.
- Loaded with Node's built-in `--env-file=.env` flag (Node 20.6+).

## Root (`package.json`)
- Private package used only to run both projects.
- Scripts:
  - `dev` → `concurrently "npm --prefix server run dev" "npm --prefix app run dev"`
  - `build` → `npm --prefix app run build`
  - `start` → `npm --prefix server run start`

## Database (`server/db.js`)
- Uses `mysql2/promise` and exports one connection pool created with `createPool`, configured from `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- No tables, migrations or models in this spec.
- Prerequisite: a running MySQL server with the `portfolio_ai` database already created.

## Server (`server/`)
- Node.js + Express, ES modules (`"type": "module"`).
- Port: `process.env.PORT` or `3000`.
- Serves static files from `server/www/` with `express.static`.
- `GET /api/health` runs `SELECT 1` on the pool and returns:
  - `200 { "status": "ok", "env": process.env.NODE_ENV, "db": "ok" }` when the query succeeds;
  - `503 { "status": "error", "env": process.env.NODE_ENV, "db": "error" }` when it fails.
- The server must start even if the database is unreachable (only `/api/health` reports the failure).
- SPA fallback: any other `GET` request that is not under `/api` returns `server/www/index.html`, so React Router routes work on page reload.
- Scripts: `start` → `node --env-file=.env index.js`, `dev` → `node --env-file=.env --watch index.js`.

## App (`app/`)
- React + Vite, ES modules.
- `index.html` with `<div id="root"></div>` loading `/src/main.jsx`.
- `src/index.css` contains only `@import "tailwindcss";`.
- `src/main.jsx`:
  - imports `./index.css`;
  - one empty component rendering `Hello World`, styled with Tailwind utility classes (e.g. `text-3xl font-bold`);
  - mounted with `createRoot` inside `BrowserRouter` from `react-router`;
  - a single route `/` that renders that component.
- `vite.config.js`:
  - plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`
  - dev server proxy: `/api` → `http://localhost:3000`
  - `build.outDir: '../server/www'`, `build.emptyOutDir: true`
- Scripts: `dev` → `vite`, `build` → `vite build`.

## Dependencies (allowed)
- root (dev): `concurrently`
- server: `express`, `mysql2`
- app: `react`, `react-dom`, `react-router`; dev: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`
- No other dependencies.

## Acceptance criteria
1. `server/.env` and `server/.env.example` exist with the variables above; `server/.env` is git-ignored.
2. `npm run dev` at the root starts both the server (port 3000) and the app (port 5173).
3. With MySQL running and `portfolio_ai` created, `GET http://localhost:3000/api/health` returns `200 { "status": "ok", "env": "development", "db": "ok" }`.
4. With MySQL stopped, the server still starts and `/api/health` returns `503` with `"db": "error"`.
5. `http://localhost:5173/` shows "Hello World" through the `/` route, with the Tailwind styles applied.
6. `http://localhost:5173/api/health` returns the server response through the Vite proxy.
7. `npm run build` at the root writes to `server/www/`; after `npm start`, `http://localhost:3000/` shows the styled "Hello World".

## Out of scope — recommendations
| Item | Recommendation |
|---|---|
| UI components | `@heroui/react` + `framer-motion` (HeroUI peer dependency) |
| Database schema / migrations | Plain SQL files run with `mysql2`, or an ORM like `sequelize` or `prisma`, in a later spec |
| Creating the `portfolio_ai` database | A small `server/scripts/init-db.js` using `mysql2` (`CREATE DATABASE IF NOT EXISTS`) in a later spec |
