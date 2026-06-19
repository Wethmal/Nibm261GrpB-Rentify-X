/**
 * @file refresh_token.model.js
 * @module RefreshTokenModel
 * @description Manages database interactions for refresh tokens, including creation, retrieval, and revocation to support secure token rotation.
 * @dependencies ../config/db.js
 * @exports create, findByToken, revoke, revokeAllForUser
 */
const { query } = require('../config/db');

const create = async (userId, token, expiresAt) => {
  const { rows } = await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token, expires_at, is_revoked`,
    [userId, token, expiresAt]
  );
  return rows[0];
};

const findByToken = async (token) => {
  const { rows } = await query(
    'SELECT * FROM refresh_tokens WHERE token = $1',
    [token]
  );
  return rows[0] || null;
};

const revoke = async (token) => {
  const { rows } = await query(
    'UPDATE refresh_tokens SET is_revoked = true, updated_at = NOW() WHERE token = $1 RETURNING id',
    [token]
  );
  return rows[0] || null;
};

const revokeAllForUser = async (userId) => {
  const { rows } = await query(
    'UPDATE refresh_tokens SET is_revoked = true, updated_at = NOW() WHERE user_id = $1 RETURNING id',
    [userId]
  );
  return rows;
};

module.exports = { create, findByToken, revoke, revokeAllForUser };
