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

const getPreview = async (req, res, next) => {
  try {
    const { booking, listing } = await loadBookingContext(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
    if (booking.consumer_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the booking consumer can preview a cancellation' });
    }
    if (!cancellable(booking)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Only pending or confirmed bookings can be cancelled' });
    }
    const policy = await resolvePolicy(listing);
    const calc = calculateRefund(booking, policy);
    res.status(200).json({
      bookingId: booking.id,
      totalPaid: Number(booking.total_price),
      refundPercent: calc.refundPercent,
      refundAmount: calc.refundAmount,
      hoursBeforeStart: Math.round(calc.hoursBeforeStart * 10) / 10,
      policy: fmt(policy),
    });
  } catch (error) { next(error); }
};

const applyCancellation = async ({ booking, actorId, providerFault, calc, reason }) => {
  const updated = await query(
    `UPDATE bookings
     SET status = 'cancelled', cancelled_by = $2, cancelled_at = NOW(), cancellation_reason = $3,
         refund_amount = $4, refund_percent = $5, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [booking.id, actorId, reason || null, calc.refundAmount, calc.refundPercent]
  );

  const pay = await query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1', [booking.id]);
  const payment = pay.rows[0];
  if (payment && payment.status === 'escrowed' && calc.refundAmount > 0) {
    await paymentService.processRefund(payment.id, calc.refundAmount, providerFault ? 'provider_cancelled' : 'consumer_cancelled');
  }
  // Provider keeps whatever was not refunded (late consumer cancellation)
  const retained = Number(booking.total_price) - calc.refundAmount;
  if (!providerFault && payment && payment.status === 'escrowed' && retained > 0) {
    await payoutService.createForBooking(updated.rows[0], retained);
  }
  return updated.rows[0];
};

