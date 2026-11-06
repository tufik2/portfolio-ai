## Description
Application to manage organizations, properties, tasks and users.

## Dependencies
- root
  - concurrently
- server
  - NodeJS
  - Express
  - MySQL2
  - GraphQL (`graphql`, `graphql-scalars`)
  - Nodemailer
- app
  - ReactJS
  - Vite
  - React Router
  - HeroUI
  - Tailwind CSS

## Rules

### Dependencies
- Never install a dependency on your own. Suggest it (name, version, why it's needed, alternatives) and ask for permission first.
- Only after permission: if working from a spec, add it to the current `spec.md` under "Dependencies (allowed)"; then install it.
- Prefer what Node, the browser or existing dependencies already provide (e.g. `fetch`, `crypto`).

### Specs
- Only create a spec when the user runs `/new-spec`.
- If there is an open spec (a folder in `specs/` outside `specs/archived/`), work on it: add new requests to its `spec.md`, `plan.md` and `tasks.md` and follow the approval rule below.
- If there is no open spec, just make the requested changes directly — no spec, plan or tasks files.
- Specs live in `specs/<YYYYMMDDHHMMSS>-<name>/` (`spec.md`, `plan.md`, `tasks.md`). Archive finished ones with `/archive-spec` (moves them to `specs/archived/`).
- **When working from a spec, don't implement anything until it is accepted.** Write `spec.md`, `plan.md` and `tasks.md` first, present them, and wait for explicit approval of all three before changing any code, database or configuration. If something changes during implementation, update the three files and get approval again before continuing.
- Keep the spec, plan and tasks in sync with what is actually built; check off tasks when done.
- Never edit archived specs.
- When something is out of scope, recommend how to do it (and which dependency, if any) in the spec's "Out of scope — recommendations" table.

### Server
- Controllers are classes with static methods in `server/src/controllers/<Name>Ctrl.js` (e.g. `UserCtrl`, `EmailCtrl`, `MigrationCtrl`). Database access, email, and business logic live there.
- Entities are data classes in `server/src/entity/<Entity>.js`, one per table (e.g. `User`): camelCase properties, status constants (`User.STATUS.ACTIVE`), the column list to select (`User.COLUMNS`, never secret columns such as hashes) and `fromRow()` to map a snake_case row. They contain no SQL; controllers keep the queries and return entity instances.
- All email code lives in `server/src/controllers/EmailCtrl.js`.
- Shared helpers live in `server/src/controllers/UtilsCtrl.js` as static methods: validation (`isEmail()`, `isUUID()`), tokens / codes / links (`hashToken()`, `newVerificationToken()`, `newLoginCode()`, `hashLoginCode()`, `hashesEqual()`, `verifyEmailUrl()`). Don't redefine them as local functions in other controllers.
- Authentication:
  - sign in is passwordless: `AuthCtrl.requestLoginCode` / `verifyLoginCode` (6-digit email code), only for `ACTIVE` users;
  - all JWT code lives in `server/src/controllers/TokenCtrl.js` (`jsonwebtoken` is imported nowhere else); access and refresh tokens use separate secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`) and carry only ids (`sub` = user uuid, `sid` = session id), never personal data;
  - resolvers that need the signed-in user call `await context.getAuth()` (returns `{ user, session }` or `null`).
- Store only hashes of secrets (tokens, codes, refresh ids), never the values; compare hashes with `UtilsCtrl.hashesEqual()`.
- All `DATETIME` columns are UTC: write them with `UTC_TIMESTAMP()`; the pool reads them as UTC (`timezone: 'Z'` in `db.js`).
- GraphQL:
  - endpoint `POST /graphql`;
  - one schema file per entity in `server/src/graphql/schema/<Entity>.graphql`, adding operations with `extend type Query` / `extend type Mutation` (never `type Mutation`);
  - one resolver file per entity in `server/src/graphql/resolver/<Entity>Res.js`; resolvers stay thin and call controllers;
  - both folders are loaded automatically; no wiring needed for new files.
  - custom scalars come from `graphql-scalars`: declare them in `schema/Scalars.graphql` (e.g. `scalar UUID`) and use them in schema files (`uuid: UUID!`, `email: EmailAddress!`) instead of `ID` / `String` for those values.
- GraphQL fields are camelCase; MySQL columns are snake_case. Controllers map between them.
- Errors to the client are `GraphQLError`s with `extensions.code` (and `field` when tied to an input). Never leak SQL details.

### Database migrations
- Plain SQL files in `server/migration/` named `YYYY_MM_DD_NNNN_description.sql` (zero-padded), run once in name order on server start and recorded in the `migration` table.
- Never edit a migration that has already run; make changes in a new file.
- A failing migration is logged, still recorded and never retried, so test new SQL on a copy of the table before it runs.

### Environment
- `server/.env` holds real values and is git-ignored. `server/.env.example` lists the same keys with empty values.
- Never commit secrets or print them in logs or chat.
- `.env` is only read at startup; restart the server after changing it.

### App
- UI uses HeroUI components and Tailwind; light and dark mode follow the system preference.
- Icons are small React components with inline SVG in `app/src/media/icons/<Name>Icon.jsx` (`currentColor`, `aria-hidden`), so they follow light / dark mode. No icon library unless approved.
- Pages live in `app/src/pages/` and are lazy loaded in `main.jsx`. Signed-in pages are nested under `RequireAuth` → `AppLayout` (fixed 100px `LateralDrawer` with Log out + the page), so they get the drawer automatically.
- Client controllers live in `app/src/controllers/<Name>Ctrl.js` (static methods).
- Tokens: `AuthCtrl` (app) stores `token` and `refresh_token` in `localStorage`; `GraphqlCtrl.request` sends `Authorization: Bearer <token>` and refreshes once on `TOKEN_EXPIRED`. Don't call the refresh endpoint from pages.
- GraphQL calls: `GraphqlCtrl.request(query)` with a single, inline query string. Write values as `"${value}"`; wrap free text that can contain `"` or `\` (names, emails…) as `"${GraphqlCtrl.escape(value)}"`. Don't use `JSON.stringify` or a separate variables object.
- UUIDs for new records are generated on the front-end with `crypto.randomUUID()`.

### Git
- Don't commit, push or open pull requests unless asked.
