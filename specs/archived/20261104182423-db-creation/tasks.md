# Tasks: Database creation (migrations)

See [spec.md](spec.md) and [plan.md](plan.md). Check each box when done.

## 1. Database config
- [x] 1.1 Move `db.js` to `server/src/controllers/db.js` and update the import in `index.js`
- [x] 1.2 Export `dbConfig` from `db.js` and build the pool from it

## 2. Migration controller
- [x] 2.1 Create `server/src/controllers/MigrationCtrl.js` with `static async init()`
- [x] 2.2 List `.sql` files in `server/migration/` sorted by name
- [x] 2.3 Read recorded files from `migration` (empty when the table doesn't exist)
- [x] 2.4 Run each pending file and insert its name into `migration`
- [x] 2.5 On SQL errors, log a warning, record the file anyway and continue with the next file

## 3. Startup
- [x] 3.1 Call `MigrationCtrl.init()` in `index.js` before `app.listen`, logging errors without stopping the server

## 4. Verify
- [x] 4.1 Empty database → `migration` table created and the bootstrap file recorded
- [x] 4.2 Restart → nothing runs
- [x] 4.3 New file → runs once and is recorded
- [x] 4.4 Failing file → warning logged, file recorded, next file runs, server still starts
- [x] 4.5 Multi-statement file → all statements run
- [x] 4.6 Remove test files and tables

## 5. User table
- [x] 5.1 Create `server/migration/2026_11_04_0001_create_user_table.sql` (`id`, `uuid`, `first_name`, `last_name`, `email`, `status`)
- [x] 5.2 Test the SQL on a temporary table, then run the migration and confirm the table and its record in `migration`
