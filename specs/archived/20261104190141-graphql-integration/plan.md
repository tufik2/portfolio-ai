# Plan: GraphQL integration

Implements [spec.md](spec.md). New dependency: `graphql` (server).

## Approach
Use `graphql` directly: read and join the `.graphql` files, `buildSchema` once, merge resolver objects into a root value, and run each request with `graphql()` from a plain Express route. Resolvers stay thin and call controllers in `src/controllers/`, matching `MigrationCtrl` / `db.js`.

## Technical decisions
| Topic | Decision | Reason |
|---|---|---|
| Library | `graphql` only (`buildSchema`, `graphql()`) | Requested; no HTTP wrapper package needed for one POST route |
| Schema merging | Base `Query` / `Mutation` with `_empty`, files use `extend type` | One schema file per entity without conflicts |
| Resolver style | Root-value object (`{ registerUser }`) | Works with `buildSchema` without extra packages |
| Auto-discovery | `fs.readdir` on `schema/` and `resolver/` (`*Res.js`) | New entities need no wiring |
| Database work | `UserCtrl.register()` in `src/controllers/` | Same controller pattern as the rest of the server |
| Errors | `GraphQLError` with `extensions.code` | Clients can branch on a code, not a message |
| Naming | camelCase in GraphQL, snake_case in MySQL | Each side keeps its convention; mapping in the controller |

## Steps
1. Install `graphql` in `server/`.
2. `src/graphql/schema/User.graphql`.
3. `src/controllers/UserCtrl.js` with `static register()`.
4. `src/graphql/resolver/UserRes.js`.
5. `src/graphql/index.js`: load schema + resolvers, `executeGraphql()`.
6. `index.js`: `POST /graphql` route (before the SPA fallback).
7. Verify on a separate port with `curl`; delete the test users afterwards.

## Risks
- `buildSchema` with a root object can't resolve nested fields with custom functions. Fine for now; the spec recommends `@graphql-tools/schema` when types start referencing each other.
