import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { dbConfig } from './db.js';

const MIGRATION_DIR = path.join(import.meta.dirname, '..', '..', 'migration');
const MIGRATION_TABLE = 'migration';

export default class MigrationCtrl {
  /**
   * Runs every SQL file in server/migration/ that is not yet recorded in the
   * `migration` table, in filename order, and records each one after it runs.
   * The first file creates the `migration` table itself, so on an empty
   * database it runs first and records its own name.
   *
   * If a file's SQL fails, the error is logged, the file is still recorded and
   * the next file runs. Only errors outside the files (e.g. the database being
   * unreachable) are thrown.
   *
   * @returns {Promise<string[]>} the files executed in this run
   */
  static async init() {
    const files = await MigrationCtrl.#listFiles();

    // Separate connection so files can contain several statements without
    // enabling multipleStatements on the shared pool.
    const connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true,
    });

    const executed = [];
    try {
      const done = await MigrationCtrl.#executedFiles(connection);

      for (const file of files) {
        if (done.has(file)) continue;

        const sql = await fs.readFile(path.join(MIGRATION_DIR, file), 'utf8');

        // SQL errors don't stop the run: the file is still recorded so it is
        // never retried, and the next file runs.
        try {
          if (sql.trim()) {
            await connection.query(sql);
          }
        } catch (error) {
          console.warn(`Migration error (ignored): ${file} - ${error.message}`);
        }

        try {
          await connection.query(
            `INSERT INTO \`${MIGRATION_TABLE}\` (\`migration\`) VALUES (?)`,
            [file],
          );
        } catch (error) {
          console.warn(
            `Migration not recorded (ignored): ${file} - ${error.message}`,
          );
        }

        executed.push(file);
        console.log(`Migration executed: ${file}`);
      }
    } finally {
      await connection.end();
    }

    return executed;
  }

  // .sql files in the migration folder, sorted by name ascending so the
  // YYYY_MM_DD_NNNN prefix sets the execution order. Plain character
  // comparison (not locale-aware) keeps the order identical on every machine.
  static async #listFiles() {
    const entries = await fs.readdir(MIGRATION_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
      .map((entry) => entry.name)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  // Names already recorded in the migration table; empty before the table exists.
  static async #executedFiles(connection) {
    try {
      const [rows] = await connection.query(
        `SELECT \`migration\` FROM \`${MIGRATION_TABLE}\``,
      );
      return new Set(rows.map((row) => row.migration));
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') return new Set();
      throw error;
    }
  }
}
