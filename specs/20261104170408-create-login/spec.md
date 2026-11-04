# Spec: Login screen

## Goal
Add a **Login** screen to the app and show it whenever there is no auth token. Only the UI and the client-side route guard are in scope. No server code, no API call and no real authentication yet.

## Structure
```
app/src/
├── main.jsx                  # routes: /login (public), / (protected)
├── controllers/
│   └── AuthCtrl.js           # AuthCtrl class with static token helpers (localStorage)
├── components/
│   └── RequireAuth.jsx       # redirects to /login when there is no token
└── pages/
    └── Login.jsx             # login form
```

## Token (`app/src/controllers/AuthCtrl.js`)
- The token lives in `localStorage` under the key `token`.
- Default export: `AuthCtrl` class with `static getToken()` → the stored string or `null`. Wrap the `localStorage` access in `try/catch` and return `null` on error.
- No `AuthCtrl.setToken` or `AuthCtrl.clearToken` yet. They come with the server spec.

## Route guard (`app/src/components/RequireAuth.jsx`)
- Wraps protected routes (a layout route that renders `<Outlet />`).
- If `AuthCtrl.getToken()` returns nothing → `<Navigate to="/login" replace />`.
- Otherwise it renders the child route.

## Login screen (`app/src/pages/Login.jsx`)
- Route: `/login`.
- If a token is already present → `<Navigate to="/" replace />`.
- Full-height page, form centered in a HeroUI `Card`.
- Title: **Sign in**.
- Fields, all required, each with a visible `<label>`:

| Field | Input | Name | Rules |
|---|---|---|---|
| Community code | `type="text"`, `autoComplete="organization"` | `communityCode` | required, trimmed |
| Email | `type="email"`, `autoComplete="email"` | `email` | required, valid email format |
| Password | `type="password"`, `autoComplete="current-password"` | `password` | required |

- Submit button: **Sign in**, full width.
- On submit:
  - prevent the default form submission;
  - validate on the client and show an error message under each invalid field;
  - when valid, do nothing else for now: no request and no token is stored. Leave a `// TODO: call login API` marker.
- Errors clear when the user edits that field.
- Works at phone width (16px side padding, no horizontal scroll).
- Supports light and dark mode and follows the system preference (`prefers-color-scheme`) by default. HeroUI switches theme with a `.dark` / `.light` class on `<html>`. A small inline script in `index.html` sets that class before the first paint and updates it when the system preference changes. `body` uses the HeroUI `bg-background text-foreground` tokens. There is no manual toggle yet.

## Routes (`app/src/main.jsx`)
- `/login` → `Login`.
- Layout route with `RequireAuth` → `/` (current `HelloWorld`).
- Any unknown path → `<Navigate to="/" replace />` (the guard then sends it to `/login` when there is no token).

## Dependencies (allowed)
- app: `@heroui/react` (v3) for the UI components, plus the peer dependencies it requires (`react-aria`, `react-aria-components`, `@react-aria/ssr`, `@react-aria/utils`, `@internationalized/date`).
- Already installed: `react`, `react-router`, Tailwind CSS.

## UI components
- The Login screen uses HeroUI components (card, form, text fields, labels, inputs, field errors, button) in place of plain Tailwind elements.
- HeroUI styles load from `index.css` (`@import "@heroui/styles";` after Tailwind).
- Light and dark mode still follow the system preference by default.

## Acceptance criteria
1. With no `token` in `localStorage`, opening `/` redirects to `/login`.
2. `/login` shows a form with Community code, Email and Password fields and a Sign in button.
3. Submitting with empty fields shows a required error under each field, and nothing is sent.
4. An invalid email shows an email format error.
5. With `localStorage.setItem('token', 'x')`, `/` shows the Hello World page and `/login` redirects to `/`.
6. `npm run build` succeeds.
7. With the system set to dark, the login renders in dark colors; with it set to light, it renders in light colors.

## Out of scope — recommendations
| Item | Recommendation |
|---|---|
| Login API (`POST /api/auth/login`) | A later spec: `bcrypt` for passwords, `jsonwebtoken` for the token |
| Storing and clearing the token, logout | Add static `setToken` and `clearToken` to `AuthCtrl` in the API spec |
| Manual light/dark toggle | Let the inline script in `index.html` read a saved choice from `localStorage` before falling back to the system preference, and add a toggle button that sets it. No extra dependency |
| CSS bundle size (~470 kB, ~43 kB gzipped) | Import only the HeroUI component styles in use instead of all of `@heroui/styles` once the UI settles |
| Form handling at scale | `react-hook-form` (+ `zod`) if forms grow; plain state is enough for now |
