# Plan: Login screen

Implements [spec.md](spec.md). No new dependencies.

## Approach
Only the client changes. An `AuthCtrl` controller with static methods reads the token. A layout route (`RequireAuth`) guards every protected route, so new pages only need to be nested under it. The Login page is a controlled form with plain React state and client-side validation.

## Technical decisions
| Topic | Decision | Reason |
|---|---|---|
| Token storage | `localStorage['token']` | Simple, and works across reloads. It may move to an httpOnly cookie when the API exists |
| Guard | Layout route + `<Outlet />` | One place to protect all future routes |
| Redirects | `<Navigate replace>` | Keeps `/login` out of the back-button history |
| Validation | Hand-written (required + email regex) | No form library allowed yet |
| UI components | HeroUI v3 (`Card`, `Form`, `TextField`, `Label`, `Input`, `FieldError`, `Button`) | Project UI library from AGENTS.md. v3 supports React 19 and Tailwind v4 |
| Validation display | Own state drives `isInvalid` and the `FieldError` text; `Form validationBehavior="aria"` | Keeps custom messages and avoids browser validation popups |
| Light/dark | Inline script in `index.html` toggles `.dark` / `.light` on `<html>` from `prefers-color-scheme` | HeroUI theme variables switch on the class, not the media query, and the script runs before paint so there is no flash |
| Page loading | `React.lazy` + one `Suspense` around `Routes` with a HeroUI `Spinner` fallback | Smaller first load; each page is its own chunk. Built into React, no new dependency |

## Steps
1. `app/src/controllers/AuthCtrl.js`: `AuthCtrl` class with `static getToken()`.
2. `app/src/components/RequireAuth.jsx`: token check → `Navigate` or `Outlet`.
3. `app/src/pages/Login.jsx`: form, validation, error messages, redirect if a token is already present.
4. `app/src/main.jsx`: wire `/login`, the guarded `/` and a catch-all.
5. Verify the acceptance criteria in the browser and run `npm run build`.

## Risks
- The token is only checked for presence, not validity. That is acceptable until the API spec.
