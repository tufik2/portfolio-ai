# Plan: Email verification

Implements [spec.md](spec.md). No new dependencies.

## Approach
Add two nullable columns to `user`: the hash of a pending one-time token and the verification date. `register()` saves the hash and emails a link with the token; a new `verifyEmail` mutation consumes it, activates the user and records the date. A small `/verify-email` page in the app connects the two.

## Technical decisions
| Topic | Decision | Reason |
|---|---|---|
| Token | 32 random bytes, base64url, generated on the server | Unguessable; URL-safe without encoding |
| Storage | SHA-256 hash in `user.email_verification_hash` | Database leaks can't be replayed; a fast hash is fine for high-entropy tokens |
| Expiry | None | Requested: links never expire |
| Single use | Clear the hash on success; `UPDATE … WHERE email_verification_hash = ?` and check `affectedRows` | A used link can't be replayed; two concurrent clicks can't both succeed |
| Audit | `email_verified_at` (UTC) | Records when verification happened |
| `INACTIVE` users | Not re-activated | A deactivated account must stay deactivated |
| Link base | `APP_URL` env | Works in development and production without code changes |
| StrictMode | `useRef` guard in the page | Effects run twice in development; the second call would see a used token |

## Steps
1. Migration `2026_11_04_0003_add_email_verification_to_user.sql`; dry run on a copy of `user` first.
2. `APP_URL` in `server/.env` (`http://localhost:5173`) and `server/.env.example` (empty).
3. `EmailCtrl.sendRegistration(user, verifyUrl)` with the link.
4. `UserCtrl.register()` token + hash + link; `UserCtrl.verifyEmail()`.
5. `User.graphql` + `UserRes.js`: `verifyEmail`.
6. App: `UserCtrl.verifyEmail()`, `pages/VerifyEmail.jsx`, `/verify-email` route.
7. Verify: register (capture the email) → open the link; reuse; `INACTIVE` user; missing token. Delete test users.

## History
- First version: hashed token with a 24-hour expiry column. Dropped (links must never expire) before being committed.
- Second version: no columns, link signed with `EMAIL_VERIFICATION_SECRET`. Replaced by this design so the verification is saved in the table; the secret was removed from `.env` and `.env.example`.
