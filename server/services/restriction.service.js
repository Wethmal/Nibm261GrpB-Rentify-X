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

