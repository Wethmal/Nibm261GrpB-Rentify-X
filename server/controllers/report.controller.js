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

