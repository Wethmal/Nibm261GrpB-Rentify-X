/**
 * @file password_reset_token.model.js
 * @module PasswordResetTokenModel
 * @description Manages database interactions for password reset tokens, including creation, retrieval by hash, and marking as used.
 * @dependencies ../config/db.js
 * @exports create, findByHash, markAsUsed
 */
const { query } = require('../config/db');

