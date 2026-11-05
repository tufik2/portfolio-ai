# Tasks: Signed-in layout and log out

See [spec.md](spec.md) and [plan.md](plan.md). **Do not start until spec.md, plan.md and tasks.md are approved.** Check each box when done.

## 0. Approval
- [x] 0.1 Decisions D1–D3 confirmed or changed
- [x] 0.2 spec.md, plan.md and tasks.md approved

## 1. Server
- [x] 1.1 `logout: Boolean!` in `Auth.graphql`; `AuthRes.logout`
- [x] 1.2 `AuthCtrl.logout(context)`: delete the current session via `context.getAuth()`

## 2. App
- [x] 2.1 `AuthCtrl.logout()` (always clears tokens)
- [x] 2.2 `components/LateralDrawer.jsx` (250px, always visible, Log out button)
- [x] 2.3 `components/AppLayout.jsx` (drawer + `<Outlet />`)
- [x] 2.4 `pages/Home.jsx`; remove `pages/HelloWorld.jsx`
- [x] 2.5 `main.jsx`: `RequireAuth` → `AppLayout` → `/` = `Home` (lazy)

## 3. Verify
- [x] 3.1 Signed in: drawer + "Hello World"
- [x] 3.2 Desktop and phone width, light and dark, no horizontal scroll
- [x] 3.3 Log out: session row deleted, tokens cleared, `/login` shown
- [x] 3.4 Old access token → `UNAUTHENTICATED`; old refresh token → `INVALID_REFRESH_TOKEN`
- [x] 3.5 `/` after logging out → `/login`
- [x] 3.6 Server unreachable: tokens still cleared, `/login` shown
- [x] 3.7 No references to `HelloWorld` remain; build succeeds
- [x] 3.8 Delete test users and sessions

## 4. Changes after implementation
- [x] 4.1 Record the 250px width and the removed "P" (user change)
- [x] 4.2 `app/src/media/icons/LogoutIcon.jsx` (inline SVG) on the left of the Log out button
- [x] 4.3 Log out button content aligned to the left
- [x] 4.4 Check light / dark and the pending state
- [x] 4.5 Move `LateralDrawer.jsx` to `components/lateralDrawer/`; add `LateralDrawerButton.jsx` (text + icon) and use it for Log out
