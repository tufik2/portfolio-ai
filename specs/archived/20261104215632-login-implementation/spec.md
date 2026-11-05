# Spec: Login implementation (email code)

## Goal
Sign in **without a password**:
1. The user enters their **email** and clicks **Send code**.
2. The server emails a **6-digit verification code**, and the screen shows an input for it.
3. If the code is right, the server creates a **token** and a **refresh token**, the app stores both, and the user lands on the `HelloWorld` screen (`/`).
4. A **Resend code** button sends a new code, but only once **5 minutes** have passed since the last one.

Builds on [create-login](../archived/20261104170408-create-login/spec.md) (Login screen, `RequireAuth`), [email-verification](../archived/20261104193215-email-verification/spec.md) and [graphql-integration](../archived/20261104190141-graphql-integration/spec.md).

## Decisions to confirm
Proposals; change any of them when reviewing.

| # | Decision | Proposal |
|---|---|---|
| D1 | Who can receive a code | **Only `ACTIVE` users** (confirmed). `EMAIL_VERIFICATION` users must verify their email with the registration link first; they, `INACTIVE` users and unknown emails get no code. The response stays the same for everyone, and step 2 reminds new users to verify their email first (with the resend-verification form). |
| D2 | Code lifetime | **10 minutes** (longer than the 5-minute resend wait, so the current code still works while the user waits) |
| D3 | Wrong code attempts | **5** wrong attempts invalidate the code; the user must request a new one (still subject to the 5-minute rule) |
| D4 | Token type | **JWT** (confirmed), created and checked with `jsonwebtoken` (approved). Access token: stateless JWT. Refresh token: JWT whose random id (`jti`) is tracked, hashed, in a `user_session` row so it can be rotated and revoked. See "Tokens (JWT)". |
| D5 | Token lifetimes | Access token **15 minutes**, refresh token **30 days**; each refresh issues a new pair (rotation) |
| D6 | Token storage in the app | `localStorage` keys `token` and `refresh_token` (`AuthCtrl.getToken()` already reads `token`) |

## Flow
1. **Request a code** (Login, step 1): Email field + **Send code** → `requestLoginCode(email)`.
   - Known `ACTIVE` user and no code sent in the last 5 minutes → a new 6-digit code is generated, saved (hashed) and emailed.
   - Otherwise (unknown email, `EMAIL_VERIFICATION`, `INACTIVE`, or a code sent less than 5 minutes ago) → nothing is sent.
   - The response is the same in every case: `{ resendAvailableAt }`, so the form can't be used to find out which emails are registered.
2. **Enter the code** (Login, step 2): "We sent a 6-digit code to **<email>**", a 6-box code input, **Verify**, **Resend code** and **Use a different email**.
   - **Resend code** is disabled until `resendAvailableAt`, showing a countdown ("Resend code in 4:32"). Clicking it calls `requestLoginCode(email)` again.
3. **Verify** → `verifyLoginCode(email, code)`:
   - correct, unexpired code → the code is cleared, a session is created and `{ token, refreshToken, tokenExpiresAt, refreshTokenExpiresAt, user }` is returned;
   - the app stores both tokens and navigates to `/`, where `RequireAuth` lets the user through to `HelloWorld`.
4. **Using the token**: every GraphQL request sends `Authorization: Bearer <token>`; the server resolves it to the current user in the request context.
5. **Refreshing**: when a request fails with `TOKEN_EXPIRED`, the app calls `refreshToken(refreshToken)` once, stores the new pair and retries. If the refresh fails, it clears both tokens and goes to `/login`.

## Database
### `2026_11_04_0004_add_login_code_to_user.sql`
| Column | Type | Notes |
|---|---|---|
| `login_code_hash` | `CHAR(64) NULL` | SHA-256 of `<user uuid>:<code>`; `NULL` when there's no pending code. Never in `User.COLUMNS`. |
| `login_code_expires_at` | `DATETIME NULL` | UTC; sent time + 10 minutes |
| `login_code_sent_at` | `DATETIME NULL` | UTC; used for the 5-minute resend rule |
| `login_code_attempts` | `TINYINT UNSIGNED NOT NULL DEFAULT 0` | wrong attempts for the current code |

- One pending code per user; a new code replaces the previous one and resets attempts.
- The code is never stored in plain text. Hashing it with the user's uuid means the same code for two users gives different hashes.

### `2026_11_04_0005_create_user_session_table.sql`
| Column | Type | Notes |
|---|---|---|
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | primary key; also the `sid` claim in both JWTs |
| `user_id` | `BIGINT UNSIGNED NOT NULL` | FK → `user.id`, `ON DELETE CASCADE` |
| `refresh_jti_hash` | `CHAR(64) NOT NULL` | SHA-256 of the current refresh token's `jti`; unique |
| `refresh_token_expires_at` | `DATETIME NOT NULL` | UTC; same as the refresh JWT's `exp` |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `refreshed_at` | `DATETIME NULL` | UTC; last successful refresh |

- One row per signed-in device. Access tokens are not stored (they're stateless JWTs).
- Refreshing replaces `refresh_jti_hash` with the new token's; the old refresh token stops working.

## Tokens (JWT)
Both tokens are JWTs signed with **HS256** by `jsonwebtoken`, with issuer `portfolio-ai`.

| | Access token (`token`) | Refresh token (`refreshToken`) |
|---|---|---|
| Secret | `JWT_SECRET` | `JWT_REFRESH_SECRET` (different, so one can't be used as the other) |
| Lifetime (`exp`) | `JWT_EXPIRES_IN`, default `15m` | `JWT_REFRESH_EXPIRES_IN`, default `30d` |
| Claims | `sub` = user uuid, `sid` = session id, `typ` = `access` | `sub` = user uuid, `sid` = session id, `typ` = `refresh`, `jti` = 32 random bytes (base64url) |
| Stored on the server | No | Only SHA-256 of `jti` in `user_session` |

- No personal data (email, name) in the claims: JWTs are signed, not encrypted, and anyone can read them.
- Checking always passes `algorithms: ['HS256']` and the issuer, so tokens signed any other way are rejected.
- **Reuse detection**: a refresh token with a valid signature whose `jti` no longer matches its session (it was already used) means it may have been stolen, so the whole session is deleted and both copies stop working.

## Environment (`server/.env`, `server/.env.example`)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: random secrets (48 random bytes, base64url), different from each other and per environment. Never committed or logged. Changing them signs everyone out.
- `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=30d`.
- All four listed with empty values in `.env.example`. The server refuses to issue tokens (logs an error, `INTERNAL_SERVER_ERROR`) if a secret is missing.

## Server
### `UtilsCtrl` additions
- `static newLoginCode()`: 6 random digits with `crypto.randomInt(0, 1_000_000)`, zero-padded (`"004821"`).
- The refresh `jti` reuses `UtilsCtrl.newVerificationToken()` (32 random bytes, base64url) and is stored as `UtilsCtrl.hashToken(jti)`.

### `TokenCtrl` (`server/src/controllers/TokenCtrl.js`)
All JWT code lives here (`jsonwebtoken` is imported nowhere else).
- `static signAccessToken({ userUuid, sessionId })` → `{ token, expiresAt }`.
- `static signRefreshToken({ userUuid, sessionId, jti })` → `{ token, expiresAt }`.
- `static verifyAccessToken(token)` / `static verifyRefreshToken(token)` → claims; check signature, `HS256`, issuer, `exp` and `typ`. Expired → throws `TOKEN_EXPIRED`; anything else invalid → throws `UNAUTHENTICATED` (access) or `INVALID_REFRESH_TOKEN` (refresh).

### `UserSession` entity (`server/src/entity/UserSession.js`)
- Data class for `user_session` (same conventions as `User`): `id`, `userId`, `refreshTokenExpiresAt`, `createdAt`, `refreshedAt`, `COLUMNS` (no hash), `fromRow()`.

### `EmailCtrl.sendLoginCode(user, code)`
- Subject: "Your sign-in code".
- Text and HTML: "Your sign-in code is **123456**. It expires in 10 minutes. If you didn't try to sign in, you can ignore this email." The code is shown large in the HTML.
- Sent in the background like the verification email; failures are logged.

### `AuthCtrl` (`server/src/controllers/AuthCtrl.js`)
- `static async requestLoginCode(email)`:
  1. Invalid email format → `BAD_USER_INPUT` (field `email`).
  2. Looks up the user. Unknown, or status other than `ACTIVE` (`EMAIL_VERIFICATION`, `INACTIVE`) → sends nothing.
  3. If `login_code_sent_at` is less than 5 minutes ago → sends nothing.
  4. Otherwise generates a code, saves hash / expiry / sent time, resets attempts and emails it.
  5. Always returns `{ resendAvailableAt }`: the real `login_code_sent_at + 5 minutes` for a known user, otherwise now + 5 minutes.
- `static async verifyLoginCode(email, code)`:
  1. Code not exactly 6 digits → `BAD_USER_INPUT` (field `code`).
  2. Unknown user, user not `ACTIVE`, or no pending code → `INVALID_CODE`, "This code is invalid. Request a new one."
  3. Code expired → `CODE_EXPIRED`, "This code has expired. Request a new one."; the code is cleared.
  4. Wrong code → attempts + 1 → `INVALID_CODE`, "This code is incorrect." On the 5th wrong attempt the code is cleared → `TOO_MANY_ATTEMPTS`, "Too many incorrect codes. Request a new one."
  5. Correct code → clears the code columns, creates a `user_session` row (with a new `jti` hash), signs the access and refresh JWTs and returns them with their expiry dates and the `User`. The user's status is never changed here.
  - Comparison uses `crypto.timingSafeEqual` on the hashes. Clearing the code is conditional on the hash still matching, so the same code can't create two sessions.
- `static async refresh(refreshToken)`:
  1. `TokenCtrl.verifyRefreshToken()`; invalid or expired → `INVALID_REFRESH_TOKEN`, "Your session has ended. Sign in again."
  2. Loads the session by `sid`; missing → `INVALID_REFRESH_TOKEN`.
  3. `jti` hash doesn't match the stored one (already used) → deletes the session (reuse detection) → `INVALID_REFRESH_TOKEN`.
  4. User no longer `ACTIVE` → deletes the session → `INVALID_REFRESH_TOKEN`.
  5. Otherwise stores a new `jti` hash (conditional on the old one, so two simultaneous refreshes can't both succeed), sets `refreshed_at`, signs a new pair and returns it.
- `static async authenticate(req)`: reads `Authorization: Bearer <token>`; `null` without a header. Otherwise `TokenCtrl.verifyAccessToken()` (throws `TOKEN_EXPIRED` / `UNAUTHENTICATED`), then loads the session (`sid`) and the user (`sub`): missing session or user not `ACTIVE` → `UNAUTHENTICATED`. Returns `{ user, session }`. Checking the session means signing out (future `logout`) takes effect immediately, not after 15 minutes.

### GraphQL
`Scalars.graphql`: add `scalar DateTime`.

`server/src/graphql/schema/Auth.graphql`:
```graphql
type LoginCodeRequest {
  resendAvailableAt: DateTime!
}

type AuthPayload {
  token: String!
  refreshToken: String!
  tokenExpiresAt: DateTime!
  refreshTokenExpiresAt: DateTime!
  user: User!
}

extend type Mutation {
  requestLoginCode(email: EmailAddress!): LoginCodeRequest!
  verifyLoginCode(email: EmailAddress!, code: String!): AuthPayload!
  refreshToken(refreshToken: String!): AuthPayload!
}
```

`server/src/graphql/resolver/AuthRes.js`: `requestLoginCode`, `verifyLoginCode`, `refreshToken` → `AuthCtrl`.

### Request context (`server/index.js`)
- Context becomes `{ req, getAuth }`; `getAuth()` calls `AuthCtrl.authenticate(req)` lazily. No resolver requires authentication yet; future ones use `await context.getAuth()`.

## App
### `AuthCtrl` (`app/src/controllers/AuthCtrl.js`)
- Keeps `getToken()`; adds `getRefreshToken()`, `setTokens({ token, refreshToken })`, `clearTokens()` (all `localStorage`, wrapped in `try/catch`).
- `static async requestLoginCode(email)` → returns `resendAvailableAt` as a `Date`.
- `static async verifyLoginCode(email, code)` → stores the pair, returns the user.
- `static async refresh()` → stores the new pair; on failure clears both and throws.
- Values go into the queries as `"${GraphqlCtrl.escape(email)}"`; the code (digits only) and tokens as `"${value}"`.

### `GraphqlCtrl.request(query)`
- Adds `Authorization: Bearer <token>` when a token is stored.
- On `TOKEN_EXPIRED`: calls `AuthCtrl.refresh()` once and retries the query. If the refresh fails: clears the tokens and sends the user to `/login`.
- `requestLoginCode`, `verifyLoginCode` and `refreshToken` never trigger a refresh.

### Login screen (`app/src/pages/Login.jsx`)
Two steps in the same `AuthLayout` card; the Register footer link stays.

**Step 1: Sign in**
- Email field (required, format checked) and **Send code** button (pending: "Sending code…").
- Success → step 2. Errors → danger alert above the button.

**Step 2: Enter your code**
- Text: "We sent a 6-digit code to **<email>**. It expires in 10 minutes."
- HeroUI `InputOTP` with 6 numeric slots (`inputMode="numeric"`, `autoComplete="one-time-code"`); submits automatically when 6 digits are entered, or with **Verify**.
- **Verify** (pending: "Verifying…"). Success → `navigate('/', { replace: true })` → `HelloWorld`.
- Errors: `INVALID_CODE` / `CODE_EXPIRED` / `TOO_MANY_ATTEMPTS` → danger alert, and the code input is cleared.
- **Resend code**: disabled with a live countdown ("Resend code in 4:32") until `resendAvailableAt`; when enabled, calls `requestLoginCode` again and restarts the countdown; shows "We sent a new code." on success.
- **Use a different email**: back to step 1 with the email kept.
- Hint below the buttons: "Didn't get a code? Only verified accounts can sign in. If you just registered, verify your email first." with a link that expands the existing `ResendVerification` form for the typed email.

### HelloWorld
- No change. Reached through `/` once a token is stored.

## Dependencies (allowed)
- server: **`jsonwebtoken` 9.0.3** (approved; installed only after this spec is approved), used only in `TokenCtrl`.
- Otherwise none new: Node's built-in `crypto` (`randomInt`, `randomBytes`, SHA-256, `timingSafeEqual`), existing `graphql`, `graphql-scalars` (`DateTime`), `mysql2`, `nodemailer`, and HeroUI's `InputOTP` (already part of `@heroui/react`).

## Acceptance criteria
1. Entering a registered email and clicking **Send code** emails a 6-digit code and shows the code step; the database holds only the code's hash.
2. Entering the right code stores `token` and `refresh_token` in `localStorage`, creates one `user_session` row (only the `jti` hash) and shows `HelloWorld`. Both tokens are HS256 JWTs with the claims listed in "Tokens (JWT)" and no personal data.
3. An unknown, `EMAIL_VERIFICATION` or `INACTIVE` email shows the same code step but no email is sent.
4. A wrong code shows "This code is incorrect."; the 5th wrong code invalidates it ("Too many incorrect codes…").
5. A code older than 10 minutes is rejected as expired.
6. **Resend code** is disabled with a countdown for 5 minutes after a code is sent; after that it sends a new code and the previous one stops working.
7. Calling `requestLoginCode` again within 5 minutes sends nothing and returns the same `resendAvailableAt`.
8. An `EMAIL_VERIFICATION` user gets no code (and `verifyLoginCode` never succeeds for them) until they verify their email with the registration link; the code step shows the verify-first hint with the resend-verification form.
9. `refreshToken` rotates the pair; reusing the old refresh token deletes the session, so the new one stops working too. An expired access token is refreshed and the request retried automatically; an invalid refresh token clears the tokens and shows `/login`.
9a. A token signed with the wrong secret, a different algorithm, or an access token used as a refresh token (and the reverse) is rejected.
10. Requests send `Authorization: Bearer <token>`; `context.getAuth()` returns the signed-in user.
11. Both steps look right in light and dark mode and at phone width.

## Out of scope — recommendations
| Item | Recommendation |
|---|---|
| Sign out (and "sign out everywhere") | `logout` mutation deleting the current `user_session` row (or all rows for the user) + a Sign out button on `HelloWorld`; access tokens stop working immediately because `authenticate` checks the session |
| Rotating JWT secrets without signing everyone out | Key ids (`kid` header) with a current and a previous secret |
| Cleaning up expired sessions | A periodic `DELETE FROM user_session WHERE refresh_token_expires_at < UTC_TIMESTAMP()` (e.g. on server start, or `node-cron`, which needs permission) |
| Rate limiting code requests across many emails from one client | `express-rate-limit` by IP (needs permission) |
| Safer token storage than `localStorage` | `httpOnly` cookie for the refresh token (needs `cookie-parser` or manual header parsing, plus CSRF protection) |
| Protecting resolvers | A small `requireAuth(context)` helper in `AuthCtrl` used by future resolvers |

## Implementation notes (approved)
See plan.md → "Implementation notes": `db.js` reads and writes `DATETIME` as UTC (`timezone: 'Z'`), and the app shares one in-flight token refresh between concurrent requests.
