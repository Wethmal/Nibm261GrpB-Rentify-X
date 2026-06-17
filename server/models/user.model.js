/**
 * @file user.model.js
 * @module UserModel
 * @description Data access layer for the users table. Provides methods for finding users by email/mobile/id, creating new users, and updating profile information including trust scores and NIC verification status. Uses parameterized queries to prevent SQL injection.
 * @dependencies ../config/db.js
 * @exports findByEmail, findByMobile, findById, create, update, updateStatus, updateTrustScore
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const { query } = require('../config/db');

const findByEmail = async (email) => {
  const { rows } = await query('SELECT * FROM users WHERE email = $1 AND is_deleted = false', [email]);
  return rows[0] || null;
};

const findByMobile = async (mobile) => {
  const { rows } = await query('SELECT * FROM users WHERE mobile = $1', [mobile]);
  return rows[0] || null;
};

