# Spec: Database creation (migrations)

## Goal
Create and update the database schema from plain SQL files in `server/migration/`. Each file runs **once**. A `migration` table records which files have run, so they are skipped on later starts. Migrations run automatically when the server starts.

## Structure
```
server/
├── index.js                          # calls MigrationCtrl.init() before listening
├── migration/
│   ├── 0000_00_00_0000_create_migration_table.sql   # creates the `migration` table
│   └── 2026_11_04_0001_create_user_table.sql        # creates the `user` table
└── src/controllers/
    ├── db.js                         # MySQL pool (+ exported connection config)
    └── MigrationCtrl.js              # MigrationCtrl class with static init()
```

## Migration files (`server/migration/`)
- Plain `.sql` files. Other files are ignored.
- Name format: `YYYY_MM_DD_NNNN_description.sql` (e.g. `2020_11_03_0001_create_user_table.sql`).
- They run in **filename order** (alphabetical), which is chronological thanks to the date prefix.
- A file may contain several SQL statements separated by `;`.
- A file that has run must never be edited. Changes go in a new file.

## `migration` table
Created by the first file, `0000_00_00_0000_create_migration_table.sql`:

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED AUTO_INCREMENT` | primary key |
| `migration` | `VARCHAR(100)` | unique; the full file name, e.g. `2020_11_03_0001_create_user_table.sql` |

## `user` table
Created by `2026_11_04_0001_create_user_table.sql`:

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | primary key |
| `uuid` | `CHAR(36)` | unique; defaults to `UUID()` (MySQL 8.0.13+), so inserts don't need to set it |
| `first_name` | `VARCHAR(100)` | required |
| `last_name` | `VARCHAR(100)` | required |
| `email` | `VARCHAR(255)` | required, unique (case-insensitive with the database's `utf8mb4_general_ci` collation) |
| `status` | `ENUM('ACTIVE', 'INACTIVE')` | required, defaults to `ACTIVE` |

## `MigrationCtrl.init()` (`server/src/controllers/MigrationCtrl.js`)
Default export: `MigrationCtrl` class with `static async init()`. Steps:

1. Read every `.sql` file in `server/migration/` and sort the names.
2. Load the names already recorded in `migration`. If the table does not exist yet (first run), treat the list as empty.
3. For each file that is **not** recorded, in order:
   1. execute its SQL;
   2. insert the file name into `migration`.
4. Return the list of files that ran, and log each one (`Migration executed: <file>`).

- The first file needs no special handling. It runs first because it sorts first, it creates the `migration` table, and its own name is inserted right after. So it never runs again.
- Empty files are recorded without running anything.
- Uses its own connection with `multipleStatements: true`, so a file can have several statements. The shared pool keeps `multipleStatements` off.
- SQL errors are **ignored**: if a file's SQL fails (e.g. the table can't be created or a row can't be inserted), log a warning (`Migration error (ignored): <file> - <message>`), still record the file in `migration`, and continue with the next file. That file is never retried.
- If recording the file fails too, log a warning (`Migration not recorded (ignored): …`) and continue.
- `init()` only throws for errors outside the files, such as the database being unreachable or `server/migration/` missing.
- When a file with several statements fails, MySQL stops at the failing statement: the statements before it are applied and the ones after it are not. To fix a failed file, add a new migration file rather than editing the old one.

## Server startup (`server/index.js`)
- `await MigrationCtrl.init()` before `app.listen`.
- If migrations fail (or the database is unreachable), log the error and **still start the server**. This keeps the original rule that the server starts without the database, and `/api/health` reports the database state.

## Dependencies (allowed)
- None new. Uses `mysql2` and Node's built-in `fs` / `path`.

## Acceptance criteria
1. On an empty `portfolio_ai` database, starting the server creates the `migration` table and records `0000_00_00_0000_create_migration_table.sql`.
2. Restarting the server runs nothing (no "Migration executed" logs).
3. Adding `2020_11_03_0001_create_user_table.sql` and restarting runs only that file once and records it.
4. A file with an SQL error logs a warning naming the file, is still recorded, the next file runs, and the server starts.
5. A file with several statements runs all of them.

## Out of scope — recommendations
| Item | Recommendation |
|---|---|
| Creating the `portfolio_ai` database itself | Connect without `database`, run `CREATE DATABASE IF NOT EXISTS`, then migrate. Can be added to `init()` later. No new dependency |
| Rolling back migrations | Add `down` files (e.g. `..._create_user_table.down.sql`) and a `MigrationCtrl.rollback()`, or use `umzug` / `knex` migrations if you want this built in |
| Running migrations from the command line without starting the server | A `migrate` script in `server/package.json` that calls `MigrationCtrl.init()` |
| Running on several servers at once | Use a MySQL lock (`GET_LOCK('migrations', …)`) around `init()` so two servers don't run the same file |
| Detecting edits to files that already ran | Store a checksum (`sha256` from Node's `crypto`) next to the name and warn when it changes |
