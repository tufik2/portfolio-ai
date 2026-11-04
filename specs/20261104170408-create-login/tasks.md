# Tasks: Login screen

See [spec.md](spec.md) and [plan.md](plan.md). Check each box when done.

## 1. Auth helper
- [x] 1.1 Create `app/src/controllers/AuthCtrl.js` with `static getToken()` (localStorage `token`, try/catch)

## 2. Route guard
- [x] 2.1 Create `app/src/components/RequireAuth.jsx` (no token → `/login`, else `<Outlet />`)

## 3. Login screen
- [x] 3.1 Create `app/src/pages/Login.jsx` with Community code, Email and Password fields and a Sign in button
- [x] 3.2 Add client-side validation (required fields, email format) with per-field errors
- [x] 3.3 Redirect to `/` when a token is already present
- [x] 3.4 Leave a `// TODO: call login API` marker in the submit handler

## 4. Routes
- [x] 4.1 Update `app/src/main.jsx`: `/login`, the guarded `/` and a catch-all redirect

## 5. Verify
- [x] 5.1 No token → `/` redirects to `/login`
- [x] 5.2 Empty submit shows required errors
- [x] 5.3 Invalid email shows a format error
- [x] 5.4 With a token → `/` shows Hello World, and `/login` redirects to `/`
- [x] 5.5 `npm run build` succeeds

## 6. Light / dark mode
- [x] 6.1 Set `color-scheme: light dark` and base `body` colors in `app/src/index.css`
- [x] 6.2 Dark styles for the Login (now provided by the HeroUI theme)
- [x] 6.3 Verify the login in light and dark (system preference)

## 7. HeroUI
- [x] 7.1 Add `@heroui/react` to the spec's allowed dependencies and install it in `app/`
- [x] 7.2 Import `@heroui/styles` in `app/src/index.css` and use HeroUI tokens on `body`
- [x] 7.3 Add the inline theme script to `app/index.html` (`.dark` / `.light` from the system preference)
- [x] 7.4 Rebuild `Login.jsx` with HeroUI `Card`, `Form`, `TextField`, `Label`, `Input`, `FieldError` and `Button`
- [x] 7.5 Verify validation, redirects, light and dark mode, and `npm run build`

## 8. Lazy loading
- [x] 8.1 Move `HelloWorld` into `app/src/pages/HelloWorld.jsx`
- [x] 8.2 Create `app/src/components/PageLoader.jsx` (HeroUI `Spinner`)
- [x] 8.3 Load `Login` and `HelloWorld` with `React.lazy` and wrap `Routes` in `Suspense`
- [x] 8.4 Verify separate page chunks in the build and on-demand loading in the browser
