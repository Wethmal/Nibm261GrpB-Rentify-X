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

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const queryText = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;

  const { rows } = await query(queryText, values);
  return rows[0] || null;
};

const updateStatus = async (id, status, reason = null) => {
  try {
    const { rows } = await query(
      'UPDATE users SET status = $1, status_reason = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, reason, id]
    );
    return rows[0];
  } catch (err) {
    // Graceful fallback for databases where the status_reason column hasn't been added yet
    if (err.message && err.message.includes('column "status_reason"')) {
      const { rows } = await query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
      );
      return rows[0];
    }
    throw err;
  }
};

const updateTrustScore = async (id, score) => {
  const { rows } = await query(
    'UPDATE users SET trust_score = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [score, id]
  );
  return rows[0] || null;
};

const updateNicDocument = async (id, url) => {
  const { rows } = await query('UPDATE users SET nic_document_url = $1 WHERE id = $2 RETURNING id, nic_document_url', [url, id]);
  return rows[0];
};

const findByEmailOrMobile = async (identifier) => {
  const { rows } = await query(
    'SELECT * FROM users WHERE (email = $1 OR mobile = $1) AND is_deleted = false',
    [identifier]
  );
  return rows[0] || null;
};

const incrementFailedAttempts = async (id) => {
  const { rows } = await query(
    `UPDATE users 
     SET failed_attempts = failed_attempts + 1,
         locked_until = CASE 
           WHEN failed_attempts + 1 >= 3 THEN NOW() + INTERVAL '30 minutes'
           ELSE locked_until
         END
     WHERE id = $1
     RETURNING failed_attempts, locked_until`,
    [id]
  );
  return rows[0];
};

const resetFailedAttempts = async (id) => {
  const { rows } = await query(
    `UPDATE users 
     SET failed_attempts = 0, locked_until = NULL 
     WHERE id = $1 
     RETURNING failed_attempts, locked_until`,
    [id]
  );
  return rows[0];
};

const updatePassword = async (id, passwordHash) => {
  const { rows } = await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
    [passwordHash, id]
  );
  return rows[0] || null;
};

const update2faStatus = async (id, isEnabled) => {
  const { rows } = await query(
    'UPDATE users SET is_2fa_enabled = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_2fa_enabled',
    [isEnabled, id]
  );
  return rows[0] || null;
};

const findAdmins = async () => {
  const { rows } = await query("SELECT * FROM users WHERE role = 'admin' AND is_deleted = false");
  return rows;
};

module.exports = {
  findByEmail,
  findByMobile,
  findById,
  create,
  update,
  updateStatus,
  updateTrustScore,
  updateNicDocument,
  findByEmailOrMobile,
  incrementFailedAttempts,
  resetFailedAttempts,
  updatePassword,
  update2faStatus,
  findAdmins
};
