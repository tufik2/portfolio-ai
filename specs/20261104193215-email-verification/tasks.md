# Tasks: Email verification

See [spec.md](spec.md) and [plan.md](plan.md). Check each box when done.

## 1. Database and config
- [x] 1.1 Create `server/migration/2026_11_04_0003_add_email_verification_to_user.sql` (`email_verification_hash`, `email_verified_at`); dry run on a copy first
- [x] 1.2 Add `APP_URL` to `server/.env` and (empty) to `server/.env.example`; no verification secret

## 2. Server
- [x] 2.1 `EmailCtrl.sendRegistration(user, verifyUrl)` with the verification link, no expiry wording
- [x] 2.2 `UserCtrl.register()`: generate token, save its hash, email the link
- [x] 2.3 `UserCtrl.verifyEmail(token)`: invalid or used / inactive / activate + `email_verified_at`, single use
- [x] 2.4 `verifyEmail` mutation in `User.graphql` and `UserRes.js`

## 3. App
- [x] 3.1 `UserCtrl.verifyEmail(token)` in `app/src/controllers/UserCtrl.js`
- [x] 3.2 `app/src/pages/VerifyEmail.jsx` (verifying, verified, failed states)
- [x] 3.3 Lazy `/verify-email` route in `main.jsx`

## 4. Verify
- [x] 4.1 Registration saves the hash (not the token); `email_verified_at` is `NULL`
- [x] 4.2 The link verifies the user: `ACTIVE`, `email_verified_at` set, hash cleared
- [x] 4.3 Reusing the link shows the invalid / already used error
- [x] 4.4 An `INACTIVE` user's link shows the account error and stays `INACTIVE`
- [x] 4.5 A link without a token shows the missing-token error
- [x] 4.6 Delete test users

## 5. Resend
- [x] 5.1 `resendVerificationEmail(email)` mutation: new token replaces the old one, always `true`, 60-second cooldown
- [x] 5.2 `UserCtrl.resendVerificationEmail()` in the app and `components/ResendVerification.jsx`
- [x] 5.3 Resend button on the Register "Check your email" card
- [x] 5.4 Resend form on the `/verify-email` failed page
- [ ] 5.5 Verify: old link invalid after resend, new link works; same answer for unknown / active emails; cooldown; delete test users
