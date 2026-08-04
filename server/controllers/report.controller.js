/**
 * User reports (US29) and admin moderation of reported users (US23).
 */
const { query } = require('../config/db');
const notificationModel = require('../models/notification.model');
const notificationService = require('../services/notification.service');
const restriction = require('../services/restriction.service');
const audit = require('../services/audit.service');

const REASONS = ['abusive_behavior', 'fraud', 'fake_profile', 'no_show', 'harassment', 'other'];
const MIN_DESCRIPTION = 20;
const DAILY_LIMIT = 5;
const ADMIN_ALERT_THRESHOLD = 3;

const notifySafe = (data) =>
  notificationModel.create(data).catch((e) => console.error('report notification failed:', e.message));

// ---------- Submit (any authenticated user) ----------

const submitReport = async (req, res, next) => {
  try {
    const reporterId = req.user.userId;
    const reportedId = req.params.id;
    const { reason, description, bookingId } = req.body || {};

    if (reporterId === reportedId) {
      return res.status(400).json({ error: 'Bad Request', message: 'You cannot report yourself' });
    }
    if (!REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Bad Request', message: `reason must be one of: ${REASONS.join(', ')}` });
    }
    const text = String(description || '').trim();
    if (text.length < MIN_DESCRIPTION) {
      return res.status(400).json({ error: 'Bad Request', message: `Please describe the problem in at least ${MIN_DESCRIPTION} characters` });
    }

    const target = await query("SELECT id, full_name FROM users WHERE id = $1 AND is_deleted = false AND role <> 'admin'", [reportedId]);
    if (!target.rows[0]) return res.status(404).json({ error: 'Not Found', message: 'User not found' });

    const today = await query(
      "SELECT COUNT(*)::int AS c FROM user_reports WHERE reporter_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'",
      [reporterId]
    );
    if (today.rows[0].c >= DAILY_LIMIT) {
      return res.status(429).json({ error: 'Too Many Requests', message: `You can submit at most ${DAILY_LIMIT} reports per day` });
    }

    const dup = await query(
      "SELECT 1 FROM user_reports WHERE reporter_id = $1 AND reported_user_id = $2 AND status IN ('pending','reviewing')",
      [reporterId, reportedId]
    );
    if (dup.rowCount > 0) {
      return res.status(409).json({ error: 'Conflict', message: 'You already have an open report against this user' });
    }

