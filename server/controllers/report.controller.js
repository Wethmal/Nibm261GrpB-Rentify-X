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

const listReports = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const params = [];
    const where = [];
    if (req.query.status && req.query.status !== 'all') { params.push(req.query.status); where.push(`r.status = $${params.length}`); }
    if (req.query.reason) { params.push(req.query.reason); where.push(`r.reason = $${params.length}`); }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = await query(`SELECT COUNT(*)::int AS c FROM user_reports r ${w}`, params);
    const { rows } = await query(
      `SELECT r.id, r.reason, r.status, r.description, r.created_at, r.resolved_at,
              r.reporter_id, rp.full_name AS reporter_name,
              r.reported_user_id, rd.full_name AS reported_name, rd.status AS reported_status, rd.role AS reported_role,
              (SELECT COUNT(*)::int FROM user_reports x WHERE x.reported_user_id = r.reported_user_id) AS reports_against_user
       FROM user_reports r
       LEFT JOIN users rp ON rp.id = r.reporter_id
       LEFT JOIN users rd ON rd.id = r.reported_user_id
       ${w}
       ORDER BY (r.status = 'pending') DESC, r.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const counts = await query('SELECT status, COUNT(*)::int AS c FROM user_reports GROUP BY status');
    res.status(200).json({ reports: rows, total: total.rows[0].c, page, limit, counts: Object.fromEntries(counts.rows.map((r) => [r.status, r.c])) });
  } catch (error) { next(error); }
};

const getReport = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.*,
              rp.full_name AS reporter_name, rp.email AS reporter_email, rp.role AS reporter_role,
              rd.full_name AS reported_name, rd.email AS reported_email, rd.role AS reported_role,
              rd.status AS reported_status, rd.status_reason AS reported_status_reason, rd.suspended_until AS reported_suspended_until,
              rd.trust_score AS reported_trust_score, rd.created_at AS reported_joined
       FROM user_reports r
       LEFT JOIN users rp ON rp.id = r.reporter_id
       LEFT JOIN users rd ON rd.id = r.reported_user_id
       WHERE r.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not Found', message: 'Report not found' });
    const [others, history] = await Promise.all([
      query(
        `SELECT id, reason, status, created_at FROM user_reports
         WHERE reported_user_id = $1 AND id <> $2 ORDER BY created_at DESC LIMIT 20`, [rows[0].reported_user_id, req.params.id]),
      query(
        `SELECT id, action, details, created_at FROM admin_audit_logs
         WHERE target_type = 'user' AND target_id = $1 ORDER BY created_at DESC LIMIT 20`, [rows[0].reported_user_id]),
    ]);
    res.status(200).json({ report: rows[0], otherReports: others.rows, moderationHistory: history.rows });
  } catch (error) { next(error); }
};

const ACTIONS = ['dismiss', 'resolve', 'warn', 'suspend', 'ban', 'review'];

