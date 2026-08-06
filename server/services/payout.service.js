/**
 * Provider payout bookkeeping (US27). A pending payout row is created when a booking completes
 * (or when a late cancellation leaves the provider a retained amount).
 */
const { query } = require('../config/db');

const PLATFORM_FEE_RATE = 0.1;

const round2 = (n) => Math.round(Number(n) * 100) / 100;

/** @returns {{gross:number, fee:number, net:number}} */
const computeAmounts = (gross, feeRate = PLATFORM_FEE_RATE) => {
  const g = round2(gross);
  const fee = round2(g * feeRate);
  return { gross: g, fee, net: round2(g - fee) };
};

const createForBooking = async (booking, grossOverride = null) => {
  const gross = grossOverride !== null ? grossOverride : booking.total_price;
  if (!(Number(gross) > 0)) return null;
  const { gross: g, fee, net } = computeAmounts(gross);
  const { rows } = await query(
    `INSERT INTO provider_payouts (provider_id, booking_id, gross_amount, platform_fee, net_amount, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     ON CONFLICT (booking_id) DO NOTHING
     RETURNING *`,
    [booking.provider_id, booking.id, g, fee, net]
  );
  if (rows[0]) {
    await query("UPDATE bookings SET payout_status = 'pending' WHERE id = $1", [booking.id]);
  }
  return rows[0] || null;
};

module.exports = { PLATFORM_FEE_RATE, computeAmounts, createForBooking };
