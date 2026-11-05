# Tasks: Login implementation (email code)

See [spec.md](spec.md) and [plan.md](plan.md). **Do not start until spec.md, plan.md and tasks.md are approved.** Check each box when done.

## 0. Approval
- [x] 0.1 Decisions D1–D6 confirmed or changed
- [x] 0.2 spec.md, plan.md and tasks.md approved

## 1. Setup and database
- [x] 1.0 Install `jsonwebtoken` 9.0.3 in `server/`; add `JWT_SECRET`, `JWT_REFRESH_SECRET` (random), `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=30d` to `server/.env`, and the same keys (empty) to `server/.env.example`
- [x] 1.1 `server/migration/2026_11_04_0004_add_login_code_to_user.sql` (dry run on a copy of `user`)
- [x] 1.2 `server/migration/2026_11_04_0005_create_user_session_table.sql` (dry run on a scratch table)

## 2. Server
- [x] 2.1 `UtilsCtrl.newLoginCode()`
- [x] 2.2 `server/src/controllers/TokenCtrl.js` (sign / verify access and refresh JWTs: HS256, issuer, `typ`, separate secrets) and `server/src/entity/UserSession.js`
- [x] 2.3 `EmailCtrl.sendLoginCode(user, code)`
- [x] 2.4 `server/src/controllers/AuthCtrl.js`: `requestLoginCode` (5-minute rule, same response for every email), `verifyLoginCode` (expiry, 5 attempts, single use, only `ACTIVE` users), `refresh` (rotation, reuse detection), `authenticate`
- [x] 2.5 `scalar DateTime` in `Scalars.graphql`; `schema/Auth.graphql`; `resolver/AuthRes.js`
- [x] 2.6 `server/index.js`: GraphQL context `{ req, getAuth }`

## 3. App
- [x] 3.1 `AuthCtrl`: `getRefreshToken`, `setTokens`, `clearTokens`, `requestLoginCode`, `verifyLoginCode`, `refresh`
- [x] 3.2 `GraphqlCtrl.request`: `Authorization` header; on `TOKEN_EXPIRED` refresh once and retry; on refresh failure clear tokens and go to `/login`
- [x] 3.3 `Login.jsx` step 1: email + Send code
- [x] 3.4 `Login.jsx` step 2: InputOTP (6 digits, auto-submit), Verify, Resend code with countdown, Use a different email, errors; success → `/`; verify-first hint with `ResendVerification`

## 4. Verify
- [x] 4.1 Send code → email captured with a 6-digit code; only its hash in the database
- [x] 4.2 Right code → JWTs stored, one `user_session` row (only the `jti` hash), `HelloWorld` shown; claims contain no personal data
- [x] 4.3 Unknown / `EMAIL_VERIFICATION` / `INACTIVE` email → same code step, no email sent
- [x] 4.4 Wrong code → "incorrect"; 5th wrong code → code invalidated
- [x] 4.5 Expired code rejected
- [x] 4.6 Resend disabled with countdown for 5 minutes; after that a new code is sent and the old one stops working
- [x] 4.7 Repeated request within 5 minutes sends nothing and returns the same `resendAvailableAt`
- [x] 4.8 `EMAIL_VERIFICATION` user gets no code; verify-first hint and resend-verification form shown
- [x] 4.9 Refresh rotates the pair; reusing an old refresh token deletes the session; expired access token refreshed and retried; invalid refresh → tokens cleared, `/login`
- [x] 4.9a Wrong secret, wrong algorithm, or access / refresh token swapped → rejected
- [x] 4.10 `context.getAuth()` returns the signed-in user
- [x] 4.11 Light and dark mode, phone width
- [x] 4.12 Delete test users and sessions
