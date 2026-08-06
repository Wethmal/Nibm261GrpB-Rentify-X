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

