# Plan: Database creation (migrations)

Implements [spec.md](spec.md). No new dependencies.

## Approach
A small migration runner in `MigrationCtrl.init()`: list the SQL files, compare them with the `migration` table, run what is missing in order, and record each file after it succeeds. The server calls it at startup.

## Technical decisions
| Topic | Decision | Reason |
|---|---|---|
| Order | Sort file names | The `YYYY_MM_DD_NNNN` prefix makes alphabetical order chronological |
| First run | Missing `migration` table → no recorded files | The bootstrap file then runs like any other and records itself |
| Recorded value | Full file name | Matches what the user sees in `server/migration/` |
| Multi-statement files | Separate connection with `multipleStatements: true` | Keeps the shared pool safer (no multi-statement queries from request handlers) |
| Shared config | `db.js` exports `dbConfig`, used by both the pool and the migration connection | One place for the connection settings |
| SQL errors in a file | Log a warning, record the file anyway, continue with the next file | Requested: one bad file must not block the others or be retried |
| Startup failure | Log and keep starting the server | Same rule as the initial spec: the server runs without the database |

## Steps
1. `db.js`: export `dbConfig` and build the pool from it.
2. `MigrationCtrl.js`: `static async init()` as described in the spec, plus small private helpers (`#listFiles`, `#executedFiles`).
3. `index.js`: run `MigrationCtrl.init()` in a `try/catch` before `app.listen`.
4. Verify against the local `portfolio_ai` database: first run, restart, new file, failing file, multi-statement file. Clean up the test files and tables afterwards.

## Risks
- A file that fails is recorded anyway, so its remaining statements never run, and DDL can't be rolled back in MySQL. Watch the startup logs for `Migration error (ignored)` and fix problems with a new file. Small files (one change each) keep the damage small.
