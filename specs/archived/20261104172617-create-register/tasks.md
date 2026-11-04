# Tasks: Registration screen

See [spec.md](spec.md) and [plan.md](plan.md). Check each box when done.

## 1. Shared pieces
- [x] 1.1 Create `app/src/components/RouterProvider.jsx` (React Aria `RouterProvider` + `useNavigate` / `useHref`)
- [x] 1.2 Create `app/src/components/AuthLayout.jsx` (title, children, footer)

## 2. Login
- [x] 2.1 Refactor `Login.jsx` to use `AuthLayout`
- [x] 2.2 Add the "Don't have an account? Register" footer link

## 3. Register
- [x] 3.1 Create `app/src/pages/Register.jsx` with First name, Last name and Email fields and a Create account button
- [x] 3.2 Add client-side validation (required, email format) with per-field errors
- [x] 3.3 Redirect to `/` when a token is present
- [x] 3.4 Add the "Already have an account? Sign in" footer link
- [x] 3.5 Leave a `// TODO: call register API` marker

## 4. Routes
- [x] 4.1 Wrap the routes in `RouterProvider` and add the lazy `/register` route in `main.jsx`

## 5. Verify
- [x] 5.1 Register link on Login opens `/register` without a full reload
- [x] 5.2 Empty submit shows required errors; invalid email shows a format error
- [x] 5.3 Sign in link goes back to `/login`
- [x] 5.4 With a token, `/register` redirects to `/`
- [x] 5.5 Light and dark mode look right
- [x] 5.6 `npm run build` succeeds with a separate `Register` chunk
