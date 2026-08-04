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

    let bookingRef = null;
    if (bookingId) {
      const b = await query(
        'SELECT id FROM bookings WHERE id = $1 AND ((consumer_id = $2 AND provider_id = $3) OR (consumer_id = $3 AND provider_id = $2))',
        [bookingId, reporterId, reportedId]
      );
      if (!b.rows[0]) return res.status(400).json({ error: 'Bad Request', message: 'bookingId does not link you with this user' });
      bookingRef = b.rows[0].id;
    }

    const { rows } = await query(
      `INSERT INTO user_reports (reporter_id, reported_user_id, booking_id, reason, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, status, reason, created_at`,
      [reporterId, reportedId, bookingRef, reason, text]
    );
    res.status(201).json({ message: 'Report submitted. Our team will review it.', report: rows[0] });

    // Alert admins once a user has accumulated several pending reports
    setImmediate(async () => {
      try {
        const pending = await query("SELECT COUNT(*)::int AS c FROM user_reports WHERE reported_user_id = $1 AND status = 'pending'", [reportedId]);
        if (pending.rows[0].c >= ADMIN_ALERT_THRESHOLD) {
          const admins = await query("SELECT id, email FROM users WHERE role = 'admin' AND is_deleted = false");
          for (const a of admins.rows) {
            await notificationService.sendEmail(a.email, 'Rentify: user has multiple pending reports',
              `<p>${target.rows[0].full_name || reportedId} now has ${pending.rows[0].c} pending reports.</p>`);
            await notifySafe({
              user_id: a.id, type: 'report_threshold', title: 'Multiple reports against a user',
              body: `${target.rows[0].full_name || 'A user'} has ${pending.rows[0].c} pending reports.`,
              metadata: { reportedUserId: reportedId },
            });
          }
        }
      } catch (e) { console.error('report threshold alert failed:', e.message); }
    });
  } catch (error) { next(error); }
};

// ---------- Admin ----------

