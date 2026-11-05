# Tasks: GraphQL integration

See [spec.md](spec.md) and [plan.md](plan.md). Check each box when done.

## 1. Setup
- [x] 1.1 Install `graphql` in `server/`

## 2. User
- [x] 2.1 Create `server/src/graphql/schema/User.graphql` (`UserStatus`, `User`, `RegisterUserInput`, `registerUser`)
- [x] 2.2 Create `server/src/controllers/UserCtrl.js` with `static register()` (validation, insert, duplicate email)
- [x] 2.3 Create `server/src/graphql/resolver/UserRes.js` with `registerUser`

## 3. GraphQL loader and endpoint
- [x] 3.1 Create `server/src/graphql/index.js` (load schema files, merge resolvers, `executeGraphql()`)
- [x] 3.2 Mount `POST /graphql` in `server/index.js`

## 4. Verify
- [x] 4.1 `registerUser` returns the new user and inserts the row
- [x] 4.2 Duplicate email → `EMAIL_TAKEN`, nothing inserted
- [x] 4.3 Invalid input → `BAD_USER_INPUT`, nothing inserted
- [x] 4.4 Missing `query` → HTTP 400
- [x] 4.5 `/api/health` still works
- [x] 4.6 Delete test users

## 5. Register screen
- [x] 5.1 Create `app/src/controllers/GraphqlCtrl.js` (`fetch` to `/graphql`, `GraphqlError` with `code` / `field`)
- [x] 5.2 Create `app/src/controllers/UserCtrl.js` with `static register()` (`registerUser` mutation)
- [x] 5.3 Call it from `Register.jsx`: pending button, success card, field and form errors
- [x] 5.4 Verify in the browser: success, duplicate email, server down; delete test users

## 6. Client-generated UUID
- [x] 6.1 Add `uuid: ID!` to `RegisterUserInput`
- [x] 6.2 Server `UserCtrl.register()`: validate the UUID format, insert it, map a duplicate UUID to `UUID_TAKEN`
- [x] 6.3 App `UserCtrl.register()`: generate the UUID with `crypto.randomUUID()`
- [x] 6.4 Verify: client UUID is stored, bad / duplicate UUID rejected, Register screen still works; delete test users

## 7. EMAIL_VERIFICATION status
- [x] 7.1 Create `server/migration/2026_11_04_0002_add_email_verification_status_to_user.sql` (new enum value, new default)
- [x] 7.2 Test the SQL on a copy of `user`: existing rows keep their status, new rows default to `EMAIL_VERIFICATION`
- [x] 7.3 Add `EMAIL_VERIFICATION` to the GraphQL `UserStatus` enum
- [x] 7.4 Run the migration on startup and confirm `registerUser` returns `EMAIL_VERIFICATION`; delete test users

## 8. Registration email
- [x] 8.1 Add `nodemailer` to the spec's allowed dependencies and install it in `server/`
- [x] 8.2 Add `EMAIL_*` variables to `server/.env` (values) and `server/.env.example` (no values), plus `EMAIL_FROM`
- [x] 8.3 Create `server/src/controllers/EmailCtrl.js` (`verify`, `send`, `sendRegistration`)
- [x] 8.4 Send the registration email from `UserCtrl.register()` in the background
- [x] 8.5 Verify the SMTP login, and that registration succeeds and logs the error when the email can't be sent
- [x] 8.6 Set `EMAIL_FROM` to an SES-verified sender and confirm a real registration email arrives

## 9. Single-argument GraphqlCtrl.request
- [x] 9.1 `GraphqlCtrl.request(query)`: no `variables` argument; sends `{ query }`
- [x] 9.2 `UserCtrl` (app): `register`, `verifyEmail`, `resendVerificationEmail` as inline queries with `"${value}"`; free text escaped with `GraphqlCtrl.escape()`
- [x] 9.3 Verify in the browser, including a name with quotes

## 10. graphql-scalars
- [x] 10.1 Ask for permission, then add `graphql-scalars` (2.0.1) to the spec and install it in `server/`
- [x] 10.2 Loader: library scalars as the base schema, files added with `extendSchema`, explicit `Query` / `Mutation` roots
- [x] 10.3 `schema/Scalars.graphql` with `UUID` and `EmailAddress`
- [x] 10.4 `User.graphql`: `uuid` → `UUID`, `email` → `EmailAddress` (type, input and resend argument)
- [x] 10.5 Verify: valid register, bad UUID / email rejected, `EMAIL_TAKEN` still works, app register + resend; delete test users
