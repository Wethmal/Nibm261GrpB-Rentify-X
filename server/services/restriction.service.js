/**
 * User restrictions (US24): timed suspension, permanent ban, reinstatement.
 * A suspension with `suspended_until` in the past is treated as expired and lifted lazily.
 */
const { query } = require('../config/db');
const refreshModel = require('../models/refresh_token.model');

const suspend = async (userId, days, reason) => {
  const d = Math.floor(Number(days));
  if (!Number.isFinite(d) || d < 1 || d > 3650) {
    const err = new Error('days must be a whole number between 1 and 3650');
    err.status = 400;
    throw err;
  }
  const { rows } = await query(
    `UPDATE users
     SET status = 'suspended', status_reason = $2, suspended_until = NOW() + ($3 || ' days')::INTERVAL, updated_at = NOW()
     WHERE id = $1 AND is_deleted = false
     RETURNING id, email, full_name, status, status_reason, suspended_until`,
    [userId, reason || 'Suspended by admin', String(d)]
  );
  if (rows[0]) await refreshModel.revokeAllForUser(userId);
  return rows[0] || null;
};

const ban = async (userId, reason) => {
  const { rows } = await query(
    `UPDATE users
     SET status = 'banned', status_reason = $2, suspended_until = NULL, banned_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND is_deleted = false
     RETURNING id, email, full_name, status, status_reason, banned_at`,
    [userId, reason || 'Banned by admin']
  );
  if (rows[0]) await refreshModel.revokeAllForUser(userId);
  return rows[0] || null;
};

const reinstate = async (userId) => {
  const { rows } = await query(
    `UPDATE users
     SET status = 'verified', status_reason = NULL, suspended_until = NULL, banned_at = NULL, updated_at = NOW()
     WHERE id = $1 AND is_deleted = false
     RETURNING id, email, full_name, status`,
    [userId]
  );
  return rows[0] || null;
};

/**
 * Returns { restricted, status, reason, until } for a user id, lifting expired suspensions.
 * Fails open (restricted: false) on unexpected DB errors so an outage does not lock everyone out.
 */
const checkRestriction = async (userId) => {
  try {
    const { rows } = await query('SELECT status, status_reason, suspended_until FROM users WHERE id = $1', [userId]);
    const u = rows[0];
    if (!u) return { restricted: false };
    if (u.status === 'banned') return { restricted: true, status: 'banned', reason: u.status_reason };
    if (u.status === 'suspended') {
      if (u.suspended_until && new Date(u.suspended_until) <= new Date()) {
        await reinstate(userId);
        return { restricted: false };
      }
      return { restricted: true, status: 'suspended', reason: u.status_reason, until: u.suspended_until };
    }
    return { restricted: false };
  } catch (err) {
    return { restricted: false };
  }
};

