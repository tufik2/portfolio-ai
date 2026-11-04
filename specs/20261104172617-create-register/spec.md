# Spec: Registration screen

## Goal
Add a **Register** screen with a registration form, and link it from the bottom of the Login screen. Only the UI is in scope. No server code, no API call and no account is created yet.

Builds on [create-login](../20261104170408-create-login/spec.md).

## Structure
```
app/src/
├── main.jsx                  # adds the lazy /register route and the React Aria RouterProvider
├── components/
│   ├── AuthLayout.jsx        # shared centered card (title, form, footer) for Login and Register
│   └── RouterProvider.jsx    # connects HeroUI / React Aria links to React Router
└── pages/
    ├── Login.jsx             # uses AuthLayout and adds the "Register" link in the footer
    └── Register.jsx          # registration form
```

## Register screen (`app/src/pages/Register.jsx`)
- Route: `/register`, public, lazy loaded like the other pages.
- If a token is already present (`AuthCtrl.getToken()`) → `<Navigate to="/" replace />`.
- Same look as Login: a HeroUI `Card` centered on the page, light and dark mode from the system preference.
- Title: **Create account**.
- Fields, all required, each with a visible label:

| Field | Input | Name | Rules |
|---|---|---|---|
| First name | `type="text"`, `autoComplete="given-name"` | `firstName` | required, trimmed |
| Last name | `type="text"`, `autoComplete="family-name"` | `lastName` | required, trimmed |
| Email | `type="email"`, `autoComplete="email"` | `email` | required, valid email format |

- First name and last name sit side by side from the `sm` breakpoint up, and stack on phones.
- Submit button: **Create account**, full width.
- On submit:
  - prevent the default form submission;
  - validate on the client and show an error message under each invalid field;
  - when valid, do nothing else for now. Leave a `// TODO: call register API` marker.
- Errors clear when the user edits that field.
- Footer: "Already have an account? **Sign in**", with the link going to `/login`.

## Login screen changes (`app/src/pages/Login.jsx`)
- Footer at the bottom of the card: "Don't have an account? **Register**", with the link going to `/register`.
- Same fields and behavior as before.

## Shared layout (`app/src/components/AuthLayout.jsx`)
- Props: `title`, `children` (the form), `footer`.
- Renders the full-height centered `Card` with the title, content and a centered footer in muted text.

## Links (`app/src/components/RouterProvider.jsx`)
- HeroUI `Link` is a React Aria link. To navigate without a full page reload, wrap the routes in React Aria's `RouterProvider` with React Router's `useNavigate` and `useHref`.

## Dependencies (allowed)
- None new. `react-aria-components` is already installed as a HeroUI peer dependency and listed in the create-login spec.

## Acceptance criteria
1. The Login card shows "Don't have an account? Register" at the bottom, and clicking Register opens `/register` without a full page reload.
2. `/register` shows First name, Last name and Email fields and a Create account button.
3. Submitting empty shows a required error under each field.
4. An invalid email shows an email format error.
5. "Sign in" on the Register screen goes back to `/login`.
6. With a token, `/register` redirects to `/`.
7. Both screens look right in light and dark mode.
8. `npm run build` succeeds and outputs a separate `Register` chunk.

## Out of scope — recommendations
| Item | Recommendation |
|---|---|
| Register API (`POST /api/auth/register`) | A later spec, alongside the login API |
| Password or community code on registration | Not requested. If users set a password, add Password and Confirm password fields; if accounts belong to a community, add Community code as on Login. Or send an invite email to set the password (needs a mail package such as `nodemailer`) |
| Duplicate validation code between Login and Register | Move `EMAIL_PATTERN` and the required checks to a shared `utils/validation.js` once a third form appears |
