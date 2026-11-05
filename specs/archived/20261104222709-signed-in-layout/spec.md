# Spec: Signed-in layout and log out

## Goal
After signing in, the user sees a fixed **lateral drawer** (**250px** wide, always visible) on the left and the page content on the right ("Hello World" for now). The drawer has a **Log out** button that ends the session on the server and returns to the Login page.

Builds on [login-implementation](../archived/20261104215632-login-implementation/spec.md) (`user_session`, `AuthCtrl`, `context.getAuth()`).

## Decisions (confirmed)
| # | Decision | Proposal |
|---|---|---|
| D1 | File names (instead of `Logged.jsx` / `App.jsx`) | `components/AppLayout.jsx` = drawer + current page (reused by every future signed-in page); `pages/Home.jsx` = "Hello World" (replaces `HelloWorld.jsx`). `App.jsx` is avoided because it usually means the root component with the routes. |
| D2 | Drawer component | `components/LateralDrawer.jsx`, plain `<aside>` + Tailwind + HeroUI `Button`. HeroUI's `Drawer` is an overlay that slides in and closes, so it doesn't fit an always-visible bar. |
| D3 | Log out when the server can't be reached | The app still clears both tokens and goes to `/login` (the server session then simply expires with its refresh token). |

## Structure
```
app/src/
├── main.jsx                       # signed-in routes nested in AppLayout
├── components/
│   ├── AppLayout.jsx              # LateralDrawer + <Outlet /> (current page)
│   └── lateralDrawer/
│       ├── LateralDrawer.jsx      # 250px fixed bar with the Log out button
│       └── LateralDrawerButton.jsx # drawer button: icon + text, left-aligned
└── pages/
    └── Home.jsx                   # "Hello World" (HelloWorld.jsx is removed)
```

## App
### `AppLayout.jsx`
- Full-height row: `LateralDrawer` on the left, a scrollable `<main>` on the right that renders the current page (`<Outlet />`) with padding.
- Used as a layout route inside `RequireAuth`, so every signed-in page gets the drawer without repeating it.

### `LateralDrawer.jsx`
- `<aside>` (`aria-label="Main navigation"`), **250px** wide, full viewport height, fixed on the left; never collapses or hides, including at phone width.
- Surface background and a right border from the HeroUI theme tokens, so light and dark mode follow the system like the rest of the app.
- Top: empty for now (reserved for navigation).
- Bottom: **Log out** button (HeroUI `Button`, ghost style, full width, small text) with a **log out icon on the left** (`app/src/media/icons/LogoutIcon.jsx`, inline SVG, `currentColor`) and its content **aligned to the left**. While logging out: pending state, "Logging out…".
- Pressing it calls `AuthCtrl.logout()` then `navigate('/login', { replace: true })`.

### `Home.jsx`
- `<h1>` "Hello World" (same style as today).

### Routes (`main.jsx`)
```jsx
<Route element={<RequireAuth />}>
  <Route element={<AppLayout />}>
    <Route path="/" element={<Home />} />
  </Route>
</Route>
```
- `AppLayout` and `Home` are lazy loaded like the other pages.

### `AuthCtrl.logout()` (app)
- Sends the `logout` mutation (with the current token through `GraphqlCtrl`, which refreshes once if the token has expired).
- Always clears `token` and `refresh_token` afterwards, even if the request fails (D3).

## Server
### GraphQL (`Auth.graphql`, `AuthRes.js`)
```graphql
extend type Mutation {
  logout: Boolean!
}
```
- `AuthRes.logout(_, context)` → `AuthCtrl.logout(context)`.

### `AuthCtrl.logout(context)`
- `const auth = await context.getAuth()` (first real use of `getAuth`).
- Signed in → deletes the current `user_session` row (`auth.session.id`) and returns `true`. Both the access token and the refresh token stop working immediately (access checks require the session).
- Not signed in (no header) → returns `true` (nothing to do).
- Expired access token → `TOKEN_EXPIRED` as usual; the app refreshes and retries.

## Dependencies (allowed)
- None new.

## Acceptance criteria
1. After signing in, `/` shows the 250px drawer on the left and "Hello World" on the right.
2. The drawer stays visible at desktop and phone width, with no horizontal scroll, in light and dark mode.
3. **Log out** deletes the current `user_session` row, clears both tokens and shows `/login`.
4. After logging out, the old access token gets `UNAUTHENTICATED` and the old refresh token gets `INVALID_REFRESH_TOKEN`.
5. Going to `/` after logging out redirects to `/login`.
6. If the server can't be reached, Log out still clears the tokens and shows `/login`.
7. `HelloWorld.jsx` no longer exists; nothing imports it.

## Out of scope — recommendations
| Item | Recommendation |
|---|---|
| Navigation links in the drawer (Organizations, Properties, Tasks, Users) | Icon + short label items in `LateralDrawer`, using HeroUI `Link` with the router |
| Icons | HeroUI has no general icon set; `lucide-react` or `@heroicons/react` (each needs permission) |
| Showing the signed-in user (name / initials) | A `me` query using `context.getAuth()`, shown at the top of the drawer |
| "Sign out everywhere" | `logoutAll` mutation deleting every `user_session` row of the user |
| Collapsible / wider drawer with labels on desktop | Toggle stored in `localStorage` |

## Changes after implementation (approved)
- Drawer width changed from 100px to **250px** and the "P" placeholder removed (made by the user in code; recorded here).
- Log out button: **icon on the left** (inline SVG `LogoutIcon`, no new dependency) and **content aligned to the left**.
- At phone width (375px) a 250px drawer leaves about 125px for the page; a collapsible or narrower drawer on small screens is listed in the recommendations.
- The icon component lives in **`app/src/media/icons/LogoutIcon.jsx`** (moved from `app/src/components/icons/` at the user's request); future icons go in `app/src/media/icons/`.
- `LateralDrawer.jsx` moved to **`app/src/components/lateralDrawer/LateralDrawer.jsx`**. Its buttons use **`lateralDrawer/LateralDrawerButton.jsx`**: props `text`, `icon` (element, e.g. `<LogoutIcon />`), `onPress`, `isPending`, `pendingText`; ghost style, full width, left-aligned, 20px gap between icon and text; the icon is hidden while pending.
