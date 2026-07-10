const { query } = require('../config/db');
const userModel = require('../models/user.model');
const listingModel = require('../models/listing.model');
const categoryModel = require('../models/category.model');
const notificationModel = require('../models/notification.model');
const notificationService = require('../services/notification.service');
const refreshModel = require('../models/refresh_token.model');
const restriction = require('../services/restriction.service');
const audit = require('../services/audit.service');

const parsePagination = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  return { page, limit, offset: (page - 1) * limit };
};

const getPendingProviders = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending_verification';
    const { page, limit, offset } = parsePagination(req);
    const { rows } = await query(
      `SELECT id, email, mobile, role, status, full_name, nic_number, nic_document_url, trust_score, created_at
       FROM users
       WHERE role = 'provider' AND is_deleted = false AND ($1 = 'all' OR status = $1)
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    res.status(200).json({ providers: rows, page, limit });
  } catch (error) {
    next(error);
  }
};

const approveProvider = async (req, res, next) => {
  try {
    const user = await userModel.updateStatus(req.params.id, 'verified', null);
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'Provider not found' });
    await notificationModel.create({
      user_id: req.params.id,
      type: 'provider_approved',
      title: 'Provider Account Approved',
      body: 'Your provider account has been approved. You can now publish listings.',
      metadata: {}
    });
    await audit.record(req.user.userId, 'provider_approved', 'user', req.params.id, { note: req.body.reason || null });
    notificationService.sendEmail(user.email, 'Your Rentify provider account was approved',
      '<p>Your provider account has been approved. You can now publish listings.</p>').catch(() => {});
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

