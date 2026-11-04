# Tasks: Initial app structure

See [spec.md](spec.md) and [plan.md](plan.md). Check each box when done.

## 1. Root
- [x] 1.1 Create root `package.json` (`private: true`, `"type": "module"`) with scripts `dev`, `build`, `start`
- [x] 1.2 Add devDependency `concurrently`
- [x] 1.3 Create `.gitignore` with `node_modules/`, `server/.env`, `server/www/`

## 2. Server
- [x] 2.1 Create `server/package.json` (`"type": "module"`) with scripts `start` and `dev` using `--env-file=.env`
- [x] 2.2 Add dependencies `express`, `mysql2`
- [x] 2.3 Create `server/.env` with the six variables from the spec
- [x] 2.4 Create `server/.env.example` with the same six variables
- [x] 2.5 Create `server/db.js` exporting a `mysql2/promise` pool from `DB_*` (`DB_PORT` as number)
- [x] 2.6 Create `server/index.js` serving `server/www/` with `express.static`
- [x] 2.7 Add `GET /api/health` (`SELECT 1` → 200 `db: ok` / 503 `db: error`)
- [x] 2.8 Add SPA fallback `GET /{*splat}` → `www/index.html`, skipping `/api` paths
- [x] 2.9 Listen on `process.env.PORT || 3000` and log the URL
- [x] 2.10 Create empty `server/www/` folder

## 3. App
- [x] 3.1 Create `app/package.json` (`"type": "module"`) with scripts `dev`, `build`
- [x] 3.2 Add dependencies `react`, `react-dom`, `react-router`
- [x] 3.3 Add devDependencies `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`
- [x] 3.4 Create `app/vite.config.js` (react + tailwind plugins, `/api` proxy to 3000, `outDir: '../server/www'`, `emptyOutDir: true`)
- [x] 3.5 Create `app/index.html` with `#root` and `/src/main.jsx` script
- [x] 3.6 Create `app/src/index.css` with `@import "tailwindcss";`
- [x] 3.7 Create `app/src/main.jsx` with `HelloWorld` component, `BrowserRouter`, `/` route

## 4. Install
- [x] 4.1 Run `npm install` in root, `server/` and `app/`

## 5. Verify
- [x] 5.1 `server/.env` is ignored by `.gitignore`
- [x] 5.2 `npm run dev` at root starts server (3000) and app (5173)
- [x] 5.3 `GET localhost:3000/api/health` → 200 `"db": "ok"` (MySQL up, `portfolio_ai` exists)
- [x] 5.4 MySQL down → server still runs, health → 503 `"db": "error"`
- [x] 5.5 `localhost:5173/` shows styled "Hello World"
- [x] 5.6 `localhost:5173/api/health` returns the proxied server response
- [x] 5.7 `npm run build` writes to `server/www/`; `npm start` → `localhost:3000/` shows styled "Hello World"
