# Plan: Registration screen

Implements [spec.md](spec.md). No new dependencies.

## Approach
Pull the shared card markup out of Login into `AuthLayout`, then build Register on it with the same form pattern (controlled state, client validation, HeroUI `TextField` + `FieldError`). Links between the two screens use HeroUI `Link`, connected to React Router through React Aria's `RouterProvider`.

## Technical decisions
| Topic | Decision | Reason |
|---|---|---|
| Shared UI | `AuthLayout` component (title, children, footer) | Login and Register share the same card and footer layout |
| Links | HeroUI `Link` + React Aria `RouterProvider` (`useNavigate`, `useHref`) | Keeps HeroUI styling and does client-side navigation without a full reload |
| Route | `/register`, lazy loaded, outside `RequireAuth` | Public page, same pattern as `/login` |
| Name fields layout | Two-column grid from `sm`, stacked on phones | Fits the narrow card on phones |
| Validation | Same hand-written approach as Login | No form library allowed |

## Steps
1. `components/RouterProvider.jsx`: React Aria `RouterProvider` wired to React Router.
2. `components/AuthLayout.jsx`: the centered card with title, content and footer.
3. `pages/Login.jsx`: use `AuthLayout` and add the Register link in the footer.
4. `pages/Register.jsx`: the form, validation, redirect when a token is present, and the Sign in link.
5. `main.jsx`: wrap the routes in `RouterProvider` and add the lazy `/register` route.
6. Verify the acceptance criteria in the browser and run `npm run build`.

## Risks
- Registration without a password or community code may not match the final account model. It is flagged in the spec's out-of-scope table.
