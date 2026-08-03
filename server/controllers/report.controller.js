/**
 * User reports (US29) and admin moderation of reported users (US23).
 */
const { query } = require('../config/db');
const notificationModel = require('../models/notification.model');
const notificationService = require('../services/notification.service');
const restriction = require('../services/restriction.service');
const audit = require('../services/audit.service');

const REASONS = ['abusive_behavior', 'fraud', 'fake_profile', 'no_show', 'harassment', 'other'];
