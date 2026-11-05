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
- Only after permission: add it to the current `spec.md` under "Dependencies (allowed)", then install it.
- Prefer what Node, the browser or existing dependencies already provide (e.g. `fetch`, `crypto`).

### Specs
- Work is driven by specs in `specs/<YYYYMMDDHHMMSS>-<name>/` (`spec.md`, `plan.md`, `tasks.md`). Create them with `/new-spec`; archive finished ones with `/archive-spec` (moves them to `specs/archived/`).
- Keep the spec, plan and tasks in sync with what is actually built; check off tasks when done.
- Never edit archived specs.
- When something is out of scope, recommend how to do it (and which dependency, if any) in the spec's "Out of scope — recommendations" table.

### Server
- Controllers are classes with static methods in `server/src/controllers/<Name>Ctrl.js` (e.g. `UserCtrl`, `EmailCtrl`, `MigrationCtrl`). Database access, email, and business logic live there.
- All email code lives in `server/src/controllers/EmailCtrl.js`.
- Shared helpers live in `server/src/controllers/UtilsCtrl.js` as static methods: validation (`isEmail()`, `isUUID()`) and tokens / links (`hashToken()`, `newVerificationToken()`, `verifyEmailUrl()`). Don't redefine them as local functions in other controllers.
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
- Pages live in `app/src/pages/` and are lazy loaded in `main.jsx`.
- Client controllers live in `app/src/controllers/<Name>Ctrl.js` (static methods).
- GraphQL calls: `GraphqlCtrl.request(query)` with a single, inline query string. Write values as `"${value}"`; wrap free text that can contain `"` or `\` (names, emails…) as `"${GraphqlCtrl.escape(value)}"`. Don't use `JSON.stringify` or a separate variables object.
- UUIDs for new records are generated on the front-end with `crypto.randomUUID()`.

### Git
- Don't commit, push or open pull requests unless asked.
