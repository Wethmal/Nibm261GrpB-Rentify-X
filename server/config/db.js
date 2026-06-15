/**
 * @file db.js
 * @module DatabaseConfig
 *
 * @description
 * PostgreSQL database connection pool configuration using the pg library. Creates a
 * connection pool with environment-based credentials and exports utility functions
 * for executing queries and acquiring clients for transactions. All model files
 * import from this module to interact with the database. The pool automatically
 * manages connections, recycling idle connections and limiting the maximum pool size.
 *
 * @dependencies
 * - pg: PostgreSQL client for Node.js (Pool class)
 *
 * @exports
 * - pool: The pg.Pool instance (for advanced usage)
 * - query: Function(text, params) — executes a single SQL query
 * - getClient: Function() — acquires a client from the pool for transactions
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'Rentify_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail if connection takes > 5s
});

/**
 * Executes a parameterized SQL query using the connection pool.
 *
 * @param {string} text - SQL query string with $1, $2 placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<import('pg').QueryResult>} Query result object
 */
const query = (text, params) => {
  // TODO: Add query logging in development mode for debugging
  // TODO: Consider adding query timing metrics for performance monitoring
  return pool.query(text, params);
};

/**
 * Acquires a dedicated client from the pool for multi-statement transactions.
 * Caller is responsible for releasing the client via client.release().
 *
 * Usage:
 *   const client = await getClient();
 *   try {
 *     await client.query('BEGIN');
 *     // ... multiple queries ...
 *     await client.query('COMMIT');
 *   } catch (err) {
 *     await client.query('ROLLBACK');
 *     throw err;
 *   } finally {
 *     client.release();
 *   }
 *
 * @returns {Promise<import('pg').PoolClient>} A dedicated database client
 */
const getClient = () => {
  // TODO: Add connection acquisition logging in development mode
  return pool.connect();
};

module.exports = { pool, query, getClient };
