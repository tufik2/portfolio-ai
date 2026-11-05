# Spec: Email verification

## Goal
Complete the registration flow: the registration email contains a link. Opening it verifies the email address, moves the user from `EMAIL_VERIFICATION` to `ACTIVE`, and records when it happened.

- Links **never expire**; they work until used once.

Builds on [graphql-integration](../20261104190141-graphql-integration/spec.md) (`registerUser`, `EmailCtrl`, `EMAIL_VERIFICATION` status).

## Flow
1. `registerUser` creates the user with status `EMAIL_VERIFICATION` and a random one-time token; only the token's hash is saved.
2. The registration email has a **Verify email** button / link: `${APP_URL}/verify-email?token=<token>`.
3. The `/verify-email` page sends the token to the `verifyEmail` mutation.
4. The server finds the user by the token's hash, sets `ACTIVE`, saves `email_verified_at` and clears the hash.

## Database (`server/migration/2026_11_04_0003_add_email_verification_to_user.sql`)
New columns on `user`:

| Column | Type | Notes |
|---|---|---|
| `email_verification_hash` | `CHAR(64) NULL` | SHA-256 (hex) of the pending token; unique; `NULL` once verified |
| `email_verified_at` | `DATETIME NULL` | UTC date and time of verification; `NULL` until verified |

- Only the **hash** is stored, never the token, so a database leak can't be used to verify accounts.
- Existing rows get `NULL` in both columns.

## Environment (`server/.env`, `server/.env.example`)
- `APP_URL`: the app's public address, used to build the link (`http://localhost:5173` in development). Empty in `.env.example`.
- No secret is needed.

## Server
### `UserCtrl` (`server/src/controllers/UserCtrl.js`)
- `register()`:
  - generates a token with `crypto.randomBytes(32)` (base64url) on the server;
  - saves its SHA-256 hash in `email_verification_hash`, in the same `INSERT`;
  - sends the registration email with the link (in the background; a failed email is logged and never fails registration).
- New `static async verifyEmail(token)`:
  1. Hashes the token and looks up the user with that hash. No match (wrong or already used) → `INVALID_TOKEN`, "This verification link is invalid or has already been used."
  2. User is `INACTIVE` → `ACCOUNT_INACTIVE`, "This account can no longer be verified." A deactivated account is never re-activated by the link.
  3. Otherwise sets `status = 'ACTIVE'`, `email_verified_at = UTC_TIMESTAMP()` and `email_verification_hash = NULL`, then returns the user.
  - The update is conditional on the hash still matching, so two simultaneous requests can't both succeed.

### GraphQL (`User.graphql`, `UserRes.js`)
```graphql
extend type Mutation {
  verifyEmail(token: String!): User!
}
```
- `UserRes.verifyEmail({ token })` → `UserCtrl.verifyEmail(token)`.

### `EmailCtrl.sendRegistration(user, verifyUrl)`
- Subject: "Verify your email address".
- Text and HTML versions with the link (HTML has a button; values HTML-escaped). No expiry wording.

## App
### `/verify-email` page (`app/src/pages/VerifyEmail.jsx`)
- Public route, lazy loaded, uses `AuthLayout`.
- Reads `token` from the query string and calls `UserCtrl.verifyEmail(token)` once (guarded against React StrictMode's double effect run in development, which would otherwise use the one-time token twice).
- States:
  - **Verifying…**: spinner;
  - **Email verified**: success alert ("Your email <email> is verified. You can now sign in.") and a **Go to sign in** link;
  - **Verification failed**: danger alert with the server message (or "This verification link is missing a token." when there's no token, without calling the server), and a **Back to sign in** link.

### `app/src/controllers/UserCtrl.js`
- New `static async verifyEmail(token)` sending the `verifyEmail` mutation.

## Resending the verification email
### Server
- Mutation:

```graphql
extend type Mutation {
  resendVerificationEmail(email: String!): Boolean!
}
```

- `UserCtrl.resendVerificationEmail(email)`:
  - invalid email format → `BAD_USER_INPUT` (field `email`);
  - if the email belongs to a user in `EMAIL_VERIFICATION`: generates a new token, **replaces** `email_verification_hash` (earlier links stop working) and sends the same verification email in the background;
  - **always returns `true`** otherwise too (unknown email, already `ACTIVE`, `INACTIVE`), so the response can't be used to find out which emails are registered;
  - cooldown: at most one resend per address every 60 seconds; extra requests return `true` without sending. The cooldown is kept in memory and resets when the server restarts.
- The shared background sender logs failures as `Verification email to <email> failed: …`.

### App
- `app/src/controllers/UserCtrl.js`: `static async resendVerificationEmail(email)`.
- `app/src/components/ResendVerification.jsx`:
  - with an `email` prop: a single **Resend email** button (secondary style); after sending: "We sent a new verification link to <email>. Earlier links no longer work.";
  - without it: an Email field (required, format checked) and a **Send new link** button; after sending: "If that email is waiting for verification, we sent it a new link. Earlier links no longer work.";
  - pending state ("Sending…"), and a danger alert for network or server errors.
- Used on the Register **Check your email** card ("Didn't receive it? Check your spam folder or" + button) and on the `/verify-email` **Verification failed** page (email form). The failed page covers users registered before verification existed and anyone whose link was already used or lost.

## Dependencies (allowed)
- None new. Uses Node's built-in `crypto`, plus `nodemailer` and `graphql` already allowed.

## Acceptance criteria
1. Registering saves a 64-character hash in `email_verification_hash`, not the token itself, and `email_verified_at` stays `NULL`.
2. The registration email contains a `/verify-email?token=…` link built from `APP_URL`, and no expiry wording.
3. Opening the link shows **Email verified**; the user becomes `ACTIVE`, `email_verified_at` is set and the hash is cleared.
4. Opening the same link again shows "This verification link is invalid or has already been used."
5. A link for an `INACTIVE` user shows the account error and the user stays `INACTIVE`.
6. A link without a token shows the missing-token error without calling the server.
7. **Resend email** on the Check your email card sends a new link; the old link then shows the invalid / already used error and the new one verifies the user.
8. The resend form on the failed page shows the same message for a pending, unknown or already verified email, and only a pending user gets an email.
9. A second resend to the same address within 60 seconds sends nothing.

## Out of scope — recommendations
| Item | Recommendation |
|---|---|
| Persistent / shared resend limit (survives restarts, works across several servers) | `express-rate-limit` with a store, or a `last_verification_sent_at` column |
| Blocking sign-in until verified | Part of the login API spec: reject users whose status is not `ACTIVE` |
| Setting a password during verification | Add a password form to `/verify-email` once `password_hash` and `bcrypt` exist |
