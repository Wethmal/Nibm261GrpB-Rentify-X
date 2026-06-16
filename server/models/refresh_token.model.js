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

