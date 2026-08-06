/**
 * Provider earnings/payouts (US27) and public provider profile (US28).
 */
const { query } = require('../config/db');
const listingModel = require('../models/listing.model');

const paging = (req, max = 50) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), max);
  return { page, limit, offset: (page - 1) * limit };
};

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ---------- Earnings (provider only) ----------

const getPayouts = async (req, res, next) => {
  try {
    const { page, limit, offset } = paging(req);
    const { status } = req.query;
    const params = [req.user.userId];
    let where = 'p.provider_id = $1';
    if (status) { params.push(status); where += ` AND p.status = $${params.length}`; }
    const total = await query(`SELECT COUNT(*)::int AS c FROM provider_payouts p WHERE ${where}`, params);
    const { rows } = await query(
      `SELECT p.*, COALESCE(sl.title, el.title, 'Booking') AS listing_title, b.scheduled_date
       FROM provider_payouts p
       JOIN bookings b ON b.id = p.booking_id
       LEFT JOIN listings sl ON sl.id = b.service_listing_id
       LEFT JOIN listings el ON el.id = b.equipment_listing_id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.status(200).json({ payouts: rows, total: total.rows[0].c, page, limit });
  } catch (error) { next(error); }
};

const getBookingEarnings = async (req, res, next) => {
  try {
    const { page, limit, offset } = paging(req);
    const total = await query('SELECT COUNT(*)::int AS c FROM provider_payouts WHERE provider_id = $1', [req.user.userId]);
    const { rows } = await query(
      `SELECT b.id AS booking_id, b.scheduled_date, b.status AS booking_status,
              COALESCE(sl.title, el.title, 'Booking') AS listing_title,
              p.gross_amount, p.platform_fee, p.net_amount, p.status AS payout_status, p.paid_at
       FROM provider_payouts p
       JOIN bookings b ON b.id = p.booking_id
       LEFT JOIN listings sl ON sl.id = b.service_listing_id
       LEFT JOIN listings el ON el.id = b.equipment_listing_id
       WHERE p.provider_id = $1
       ORDER BY b.scheduled_date DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [req.user.userId]
    );
    res.status(200).json({ earnings: rows, total: total.rows[0].c, page, limit });
  } catch (error) { next(error); }
};

