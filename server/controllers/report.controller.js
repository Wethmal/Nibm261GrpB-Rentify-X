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

