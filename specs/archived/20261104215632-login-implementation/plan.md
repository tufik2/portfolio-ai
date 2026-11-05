# Plan: Login implementation (email code)

Implements [spec.md](spec.md). New dependency: `jsonwebtoken` 9.0.3 (approved; installed after this spec is approved). **Approved and implemented.**

## Approach
Passwordless sign in. `requestLoginCode` emails a 6-digit code stored hashed on the `user` row with an expiry, a sent time and an attempt counter. `verifyLoginCode` checks it and issues an access JWT and a refresh JWT; the refresh token's `jti` is tracked, hashed, in `user_session` for rotation and revocation. The app keeps both tokens in `localStorage`, sends the access token on every GraphQL request, refreshes it transparently when it expires, and shows `HelloWorld` after signing in.

## Technical decisions
| Topic | Decision | Reason |
|---|---|---|
| Code | 6 digits from `crypto.randomInt` | Requested format; cryptographically random |
| Code storage | SHA-256 of `<uuid>:<code>` in `user.login_code_hash` | Never stored in plain text; per-user hash |
| Code lifetime | 10 minutes | Outlives the 5-minute resend wait |
| Brute force | 5 wrong attempts clear the code; new codes only every 5 minutes | Caps guesses at 5 per 5 minutes per account |
| Resend rule | Enforced on the server from `login_code_sent_at`; the app only shows the countdown | The client can't bypass it |
| Same response for every email | `requestLoginCode` always returns `resendAvailableAt` | The form can't be used to discover accounts |
| Unverified users | No code until the email is verified with the registration link (D1) | Only `ACTIVE` users can sign in |
| Tokens | JWT (HS256, `jsonwebtoken`), separate secrets for access and refresh, `typ` claim | Requested; a token of one kind can't be used as the other |
| JWT code | Only in `TokenCtrl` | One place for signing / checking rules (algorithm, issuer, expiry) |
| Refresh tracking | SHA-256 of the refresh `jti` in `user_session`; reuse deletes the session | Rotation, revocation and theft detection without storing tokens |
| Access check | Signature + expiry, then session and user status | Future sign out works immediately; deactivated users lose access at once |
| Lifetimes | 15 min access, 30 days refresh, rotation on refresh | Short-lived bearer token, long sessions |
| Single use | Conditional `UPDATE … WHERE login_code_hash = ?` / `refresh_jti_hash = ?` | Two concurrent requests can't both succeed |
| Auth in resolvers | Lazy `context.getAuth()` | Requests that don't need the user don't hit the database |
| Retry on expiry | One refresh + one retry inside `GraphqlCtrl.request` | Pages don't need to know about token expiry |
| Code input | HeroUI `InputOTP`, numeric, auto-submit at 6 digits | Already in `@heroui/react`; supports one-time-code autofill |

## Steps
1. Install `jsonwebtoken`; add `JWT_SECRET`, `JWT_REFRESH_SECRET` (random), `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` to `server/.env` and (empty) to `.env.example`.
1b. Migrations `0004` (login code columns on `user`) and `0005` (`user_session`), each tested on a copy / scratch table before it runs.
2. `UtilsCtrl.newLoginCode()`; `TokenCtrl` (sign / verify access and refresh JWTs); `UserSession` entity.
3. `EmailCtrl.sendLoginCode(user, code)`.
4. Server `AuthCtrl`: `requestLoginCode`, `verifyLoginCode`, `refresh`, `authenticate`.
5. `scalar DateTime`, `Auth.graphql`, `AuthRes.js`; `server/index.js` context `{ req, getAuth }`.
6. App `AuthCtrl`: token helpers, `requestLoginCode`, `verifyLoginCode`, `refresh`; `GraphqlCtrl` header + refresh-and-retry.
7. `Login.jsx`: email step and code step (InputOTP, countdown, resend, change email).
8. Verify every acceptance criterion (API + browser, emails captured instead of sent); delete test users and sessions.

## Risks
- A 6-digit code has 1,000,000 possibilities; the 5-attempt limit and 5-minute resend rule keep online guessing impractical. An offline guess from a leaked hash is possible but only useful for 10 minutes.
- Emails must actually arrive (`EMAIL_FROM` set, SES out of sandbox for real users); otherwise nobody can sign in.
- Anyone can read a JWT's claims, so they contain only ids (`sub` = uuid, `sid`), never email or names.
- Leaked `JWT_SECRET` would let someone sign access tokens; `authenticate` still requires an existing session for the `sid`, which limits the damage.
- `localStorage` tokens are readable by any script on the page; acceptable for now, with an `httpOnly` cookie listed as a future improvement.

## Implementation notes (added during implementation; approved)
- **UTC dates from MySQL**: `server/src/controllers/db.js` now sets `timezone: 'Z'`. All `DATETIME` columns hold UTC (`UTC_TIMESTAMP()`), but `mysql2` read them as local time by default, which would have shifted code expiry, resend times and session dates. This also corrects `User.emailVerifiedAt`.
- **One refresh at a time in the app**: `AuthCtrl.refresh()` shares a single in-flight refresh between requests that hit `TOKEN_EXPIRED` together. Two refreshes with the same refresh token would otherwise trigger reuse detection and end the session.
- **Login code helpers**: `UtilsCtrl.hashLoginCode(uuid, code)` and `UtilsCtrl.hashesEqual(a, b)` (timing-safe) were added next to `newLoginCode()`.
- **Testing without real emails**: browser tests ran against a second server on port 3999 started with an empty `EMAIL_FROM`, so no email was sent to test addresses; a known code hash was set in the database to sign in.
