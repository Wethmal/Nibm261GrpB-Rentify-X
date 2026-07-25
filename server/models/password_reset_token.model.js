/**
 * @file password_reset_token.model.js
 * @module PasswordResetTokenModel
 * @description Manages database interactions for password reset tokens, including creation, retrieval by hash, and marking as used.
 * @dependencies ../config/db.js
 * @exports create, findByHash, markAsUsed
 */
const { query } = require('../config/db');

const create = async (userId, tokenHash, expiresAt) => {
  const { rows } = await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token_hash, expires_at, is_used`,
    [userId, tokenHash, expiresAt]
  );
  return rows[0];
};

const findByHash = async (tokenHash) => {
  const { rows } = await query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = $1',
    [tokenHash]
  );
  return rows[0] || null;
};

const markAsUsed = async (tokenId) => {
  const { rows } = await query(
    'UPDATE password_reset_tokens SET is_used = true WHERE id = $1 RETURNING id',
    [tokenId]
  );
  return rows[0] || null;
};

module.exports = { create, findByHash, markAsUsed };
