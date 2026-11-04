# Plan: Initial app structure

Implements [spec.md](spec.md). Only the dependencies listed in the spec are installed.

## Approach
Three independent npm projects (root, `server/`, `app/`), all ES modules. The root only orchestrates. The server is built first so the app's proxy and the production build have something to talk to.

## Technical decisions
| Topic | Decision | Reason |
|---|---|---|
| Module system | `"type": "module"` in every `package.json` | Same `import` syntax in server and app |
| Env loading | `node --env-file=.env` | Built into Node 20.6+ (installed: v22), no `dotenv` |
| Express version | Express 5 (current `latest`) | SPA fallback must use `app.get('/{*splat}', …)` — the Express 4 `'*'` path is not valid in Express 5 |
| DB access | `mysql2/promise` `createPool` | Promise API, pool reused by future routes |
| DB failure | Health route catches the query error | Server starts even when MySQL is down |
| Tailwind | v4 via `@tailwindcss/vite` | No `tailwind.config.js` or PostCSS config needed |
| Router | `react-router` (v7) `BrowserRouter` + `Routes`/`Route` | Single package, no `react-router-dom` |
| Build output | Vite `outDir: '../server/www'` | Express serves the built app in production |

## Steps

### 1. Root
- `package.json`: `private: true`, scripts `dev`, `build`, `start` (see spec), devDependency `concurrently`.
- `.gitignore`: `node_modules/`, `server/.env`, `server/www/`.

### 2. Server
- `server/package.json`: scripts `start` / `dev` with `--env-file=.env`; dependencies `express`, `mysql2`.
- `server/.env` and `server/.env.example` with the six variables from the spec.
- `server/db.js`: export a pool built from `DB_*` (cast `DB_PORT` to number).
- `server/index.js`:
  1. `express.static(www)` where `www` is resolved from `import.meta.dirname`.
  2. `GET /api/health` → `await pool.query('SELECT 1')`; 200 on success, 503 on error.
  3. SPA fallback `GET /{*splat}` → `res.sendFile(www/index.html)`, skipping paths under `/api` (`next()`).
  4. Listen on `process.env.PORT || 3000` and log the URL.
- Create `server/www/` (empty until the first build).

### 3. App
- `app/package.json`: scripts `dev`, `build`; dependencies `react`, `react-dom`, `react-router`; devDependencies `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`.
- `app/vite.config.js`: plugins `react()` and `tailwindcss()`, `server.proxy['/api'] = 'http://localhost:3000'`, `build.outDir: '../server/www'`, `build.emptyOutDir: true`.
- `app/index.html`: `<div id="root">` and `<script type="module" src="/src/main.jsx">`.
- `app/src/index.css`: `@import "tailwindcss";`.
- `app/src/main.jsx`: import CSS, `HelloWorld` component (`<h1 className="text-3xl font-bold">Hello World</h1>`), `createRoot` → `BrowserRouter` → `Routes` with `/` route.

### 4. Install
- `npm install` in root, `server/` and `app/` (or `npm --prefix`).

### 5. Verify (acceptance criteria)
1. `server/.env` exists and is ignored by `.gitignore`.
2. `npm run dev` at root → both processes start (3000 and 5173).
3. `curl localhost:3000/api/health` → 200 with `"db": "ok"` (MySQL up, `portfolio_ai` created).
4. Stop MySQL → server keeps running, health returns 503 `"db": "error"`.
5. Open `localhost:5173/` → styled "Hello World".
6. `curl localhost:5173/api/health` → proxied server response.
7. `npm run build` → files in `server/www/`; `npm start` → `localhost:3000/` shows styled "Hello World".

## Risks
- MySQL not running or `portfolio_ai` missing → criterion 3 fails; acceptable, reported by the health route (DB creation is out of scope).
- `emptyOutDir` on a folder outside the Vite root: Vite only warns without the flag; with `emptyOutDir: true` it clears `server/www/` on each build, which is intended.
