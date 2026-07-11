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

const rejectProvider = async (req, res, next) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason) return res.status(400).json({ error: 'Bad Request', message: 'A rejection reason is required' });
    const user = await userModel.updateStatus(req.params.id, 'suspended', reason);
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'Provider not found' });
    await notificationModel.create({
      user_id: req.params.id,
      type: 'provider_rejected',
      title: 'Provider Verification Rejected',
      body: reason,
      metadata: { reason }
    });
    await audit.record(req.user.userId, 'provider_rejected', 'user', req.params.id, { reason });
    notificationService.sendEmail(user.email, 'Your Rentify provider application', `<p>Unfortunately your application was rejected: ${reason}</p>`).catch(() => {});
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const getPendingNICVerifications = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, email, mobile, full_name, role, status, nic_number, nic_document_url, created_at
       FROM users
       WHERE nic_document_url IS NOT NULL
         AND status = 'pending_verification'
         AND is_deleted = false
       ORDER BY created_at ASC`
    );
    res.status(200).json({ verifications: rows });
  } catch (error) {
    next(error);
  }
};

const getListingsForModeration = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending_approval';
    const type = req.query.type || '';
    const { page, limit, offset } = parsePagination(req);
    const { results, total } = await listingModel.findAll({ status, type }, { limit, offset });
    res.status(200).json({ listings: results, results, total, page, limit });
  } catch (error) {
    next(error);
  }
};

const approveListing = async (req, res, next) => {
  try {
    const listing = await listingModel.updateStatus(req.params.id, 'active');
    if (!listing) return res.status(404).json({ error: 'Not Found', message: 'Listing not found' });
    await notificationModel.create({
      user_id: listing.provider_id,
      type: 'listing_approved',
      title: 'Listing Approved',
      body: `"${listing.title}" is now live in search.`,
      metadata: { listingId: listing.id }
    });
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

const suspendListing = async (req, res, next) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5) {
      return res.status(400).json({ error: 'Bad Request', message: 'A suspension reason (min 5 characters) is required' });
    }
    const listing = await listingModel.updateStatus(req.params.id, 'suspended');
    if (!listing) return res.status(404).json({ error: 'Not Found', message: 'Listing not found' });
    await query('UPDATE listings SET suspension_reason = $1 WHERE id = $2', [reason, listing.id]);
    await notificationModel.create({
      user_id: listing.provider_id,
      type: 'listing_suspended',
      title: 'Listing Suspended',
      body: reason,
      metadata: { listingId: listing.id }
    });
    await audit.record(req.user.userId, 'listing_suspended', 'listing', listing.id, { reason });
    res.status(200).json({ ...listing, suspension_reason: reason });
  } catch (error) {
    next(error);
  }
};

