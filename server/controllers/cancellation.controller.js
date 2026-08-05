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

const setListingPolicy = async (req, res, next) => {
  try {
    const { policy_type } = req.body;
    if (!POLICY_TYPES.includes(policy_type)) {
      return res.status(400).json({ error: 'Bad Request', message: `policy_type must be one of: ${POLICY_TYPES.join(', ')}` });
    }
    const { rows } = await query('SELECT id, provider_id, type FROM listings WHERE id = $1', [req.params.id]);
    const listing = rows[0];
    if (!listing) return res.status(404).json({ error: 'Not Found', message: 'Listing not found' });
    if (listing.provider_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only change the policy of your own listings' });
    }
    const p = PRESETS[policy_type];
    await query(
      `INSERT INTO cancellation_policies (listing_id, listing_type, policy_type, full_refund_hours, partial_refund_hours, partial_refund_percent)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (listing_id) WHERE listing_id IS NOT NULL
       DO UPDATE SET policy_type = EXCLUDED.policy_type, full_refund_hours = EXCLUDED.full_refund_hours,
                     partial_refund_hours = EXCLUDED.partial_refund_hours,
                     partial_refund_percent = EXCLUDED.partial_refund_percent, updated_at = NOW()`,
      [listing.id, listing.type, policy_type, p.full_refund_hours, p.partial_refund_hours, p.partial_refund_percent]
    );
    res.status(200).json({ policy: fmt(await resolvePolicy(listing)) });
  } catch (error) { next(error); }
};

const loadBookingContext = async (bookingId) => {
  const booking = await bookingModel.findById(bookingId);
  if (!booking) return {};
  const listingId = booking.service_listing_id || booking.equipment_listing_id;
  const l = await query('SELECT id, type, title FROM listings WHERE id = $1', [listingId]);
  const listing = l.rows[0] || { id: listingId, type: booking.booking_type === 'equipment' ? 'equipment' : 'service' };
  return { booking, listing };
};

const cancellable = (b) => ['pending', 'confirmed'].includes(b.status);

