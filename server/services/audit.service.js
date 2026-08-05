/**
 * Admin audit trail (US23/US24). Failures never block the admin action itself.
 */
const { query } = require('../config/db');

const record = async (adminId, action, targetType, targetId, details = {}) => {
  try {
    await query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId || null, action, targetType, targetId || null, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};

