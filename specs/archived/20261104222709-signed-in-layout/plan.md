# Plan: Signed-in layout and log out

Implements [spec.md](spec.md). No new dependencies. **Approved and implemented.**

## Approach
Add a layout route (`AppLayout`) inside `RequireAuth` that renders a fixed 250px `LateralDrawer` next to the current page. Rename the home page to `Home`. Add a `logout` mutation that deletes the current session through `context.getAuth()`, and an app `AuthCtrl.logout()` that calls it and always clears the tokens.

## Technical decisions
| Topic | Decision | Reason |
|---|---|---|
| Names | `AppLayout` + `LateralDrawer` + `pages/Home` | Layout reused by future pages; `App.jsx` reserved for a root component |
| Drawer | Plain `<aside>`, Tailwind, HeroUI `Button` | HeroUI `Drawer` is an overlay, not a permanent bar |
| Width | `w-[250px]` + `shrink-0` | Changed from 100px by the user; never squeezed by the content |
| Logout icon | Inline SVG component, `currentColor`, `aria-hidden` | No icon dependency (chosen over `lucide-react` / `@heroicons/react`); follows light / dark text color |
| Log out on the server | Delete the `user_session` row | Access and refresh tokens stop working at once (access checks need the session) |
| Log out failure | Clear tokens anyway | The user always ends up signed out on this device |

## Steps
1. Server: `logout` in `Auth.graphql`, `AuthRes.logout`, `AuthCtrl.logout(context)`.
2. App: `AuthCtrl.logout()`.
3. App: `LateralDrawer.jsx`, `AppLayout.jsx`, `pages/Home.jsx`; delete `HelloWorld.jsx`; nested routes in `main.jsx`.
4. Verify the acceptance criteria (API + browser, light / dark, phone width); delete test data.
