/**
 * Applies idempotent migrations to the configured database.
 * Usage: `npm run migrate` (applies 18_gap_features.sql) or `node db/migrate.js <file.sql> [...]`.
 * NOTE: runs against whatever DB_* variables are in server/.env — check them first.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const files = process.argv.slice(2);
if (files.length === 0) files.push('18_gap_features.sql');

(async () => {
  try {
    console.log(`Target DB host: ${process.env.DB_HOST} / ${process.env.DB_NAME}`);
    for (const f of files) {
      const sql = fs.readFileSync(path.join(__dirname, 'migrations', f), 'utf8');
      await pool.query(sql);
      console.log(`Applied ${f}`);
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
