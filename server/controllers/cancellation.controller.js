/**
 * Cancellation policies, refund preview and cancellation flows (US26).
 */
const { query } = require('../config/db');
const bookingModel = require('../models/booking.model');
const notificationModel = require('../models/notification.model');
const paymentService = require('../services/payment.service');
const payoutService = require('../services/payout.service');
const { PRESETS, POLICY_TYPES, calculateRefund, describePolicy } = require('../config/cancellationPolicies');

const fmt = (p) => ({ ...p, ...describePolicy(p) });

/** Effective policy: listing override -> platform default for the type -> moderate preset. */
const resolvePolicy = async (listing) => {
  const own = await query('SELECT * FROM cancellation_policies WHERE listing_id = $1', [listing.id]);
  if (own.rows[0]) return { ...own.rows[0], source: 'listing' };
  const def = await query(
    'SELECT * FROM cancellation_policies WHERE listing_id IS NULL AND listing_type = $1',
    [listing.type]
  );
  if (def.rows[0]) return { ...def.rows[0], source: 'platform_default' };
  return { policy_type: 'moderate', ...PRESETS.moderate, source: 'platform_default' };
};

const getListingPolicy = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, type FROM listings WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not Found', message: 'Listing not found' });
    res.status(200).json({ policy: fmt(await resolvePolicy(rows[0])) });
  } catch (error) { next(error); }
};

