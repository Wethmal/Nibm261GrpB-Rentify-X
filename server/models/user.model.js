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

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1 AND is_deleted = false', [id]);
  return rows[0] || null;
};

const create = async (userData) => {
  const { mobile, email, password_hash, role, nic_number, status, full_name } = userData;
  const fallbackEmail = email || `${mobile}@Rentify.lk`;
  const { rows } = await query(
    `INSERT INTO users (mobile, email, password_hash, role, nic_number, status, full_name) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING id, mobile, email, role, status, full_name`,
    [mobile, fallbackEmail, password_hash, role, nic_number, status || 'pending_verification', full_name || null]
  );
  return rows[0];
};

const update = async (id, updateData) => {
  const allowedFields = ['full_name', 'display_name', 'bio', 'address', 'district', 'country', 'mobile', 'profile_photo_url', 'visibility_settings', 'notification_preferences'];
  const fields = [];
  const values = [];
  let index = 1;

