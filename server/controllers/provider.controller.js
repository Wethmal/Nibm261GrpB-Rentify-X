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

const getEarningsSummary = async (req, res, next) => {
  try {
    const uid = req.user.userId;
    const [totals, monthly, daily, thisMonth] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(net_amount) FILTER (WHERE status = 'paid'), 0)::float AS total_paid,
                COALESCE(SUM(net_amount) FILTER (WHERE status IN ('pending','processing')), 0)::float AS pending_balance,
                COALESCE(SUM(net_amount), 0)::float AS lifetime_net,
                COALESCE(SUM(platform_fee), 0)::float AS total_fees,
                COUNT(*)::int AS payout_count
         FROM provider_payouts WHERE provider_id = $1`, [uid]),
      query(
        `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COALESCE(SUM(net_amount), 0)::float AS net
         FROM provider_payouts
         WHERE provider_id = $1 AND created_at >= date_trunc('month', NOW()) - INTERVAL '5 months'
         GROUP BY 1 ORDER BY 1`, [uid]),
      query(
        `SELECT to_char(d::date, 'YYYY-MM-DD') AS day, COALESCE(SUM(p.net_amount), 0)::float AS net
         FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') d
         LEFT JOIN provider_payouts p ON p.provider_id = $1 AND p.created_at::date = d::date
         GROUP BY 1 ORDER BY 1`, [uid]),
      query(
        `SELECT COALESCE(SUM(net_amount), 0)::float AS net FROM provider_payouts
         WHERE provider_id = $1 AND created_at >= date_trunc('month', NOW())`, [uid]),
    ]);

    // Fill the last 6 months even when there is no data
    const map = new Map(monthly.rows.map((r) => [r.month, r.net]));
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ month: key, net: map.get(key) || 0 });
    }

    res.status(200).json({
      summary: { ...totals.rows[0], this_month: thisMonth.rows[0].net },
      monthly: months,
      last7Days: daily.rows,
    });
  } catch (error) { next(error); }
};

