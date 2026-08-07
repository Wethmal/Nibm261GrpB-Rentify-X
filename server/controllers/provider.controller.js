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

const exportPayoutsCsv = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.id, b.scheduled_date, COALESCE(sl.title, el.title, 'Booking') AS listing,
              p.gross_amount, p.platform_fee, p.net_amount, p.status, p.paid_at, p.created_at
       FROM provider_payouts p
       JOIN bookings b ON b.id = p.booking_id
       LEFT JOIN listings sl ON sl.id = b.service_listing_id
       LEFT JOIN listings el ON el.id = b.equipment_listing_id
       WHERE p.provider_id = $1 ORDER BY p.created_at DESC`,
      [req.user.userId]
    );
    const header = ['payout_id', 'scheduled_date', 'listing', 'gross_amount', 'platform_fee', 'net_amount', 'status', 'paid_at', 'created_at'];
    const lines = [header.join(',')].concat(rows.map((r) => [
      r.id, r.scheduled_date instanceof Date ? r.scheduled_date.toISOString().slice(0, 10) : r.scheduled_date,
      r.listing, r.gross_amount, r.platform_fee, r.net_amount, r.status, r.paid_at, r.created_at,
    ].map(csvCell).join(',')));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rentify-payouts.csv"');
    res.status(200).send(lines.join('\n'));
  } catch (error) { next(error); }
};

// ---------- Public provider profile (anyone) ----------

const findPublicProvider = async (id) => {
  const { rows } = await query(
    `SELECT id, full_name, bio, profile_photo_url, district, country, trust_score, created_at
     FROM users
     WHERE id = $1 AND role = 'provider' AND status = 'verified' AND is_deleted = false`,
    [id]
  );
  return rows[0] || null;
};

const getPublicProvider = async (req, res, next) => {
  try {
    const provider = await findPublicProvider(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Not Found', message: 'Provider not found' });
    const stats = await query(
      `SELECT COUNT(*)::int AS review_count, COALESCE(AVG(rating), 0)::numeric(3,2) AS average_rating
       FROM reviews WHERE reviewee_id = $1 AND status = 'approved'`, [provider.id]);
    const listings = await query(
      "SELECT COUNT(*)::int AS c FROM listings WHERE provider_id = $1 AND status = 'active'", [provider.id]);
    res.status(200).json({
      provider: {
        ...provider,
        review_count: stats.rows[0].review_count,
        average_rating: Number(stats.rows[0].average_rating),
        active_listing_count: listings.rows[0].c,
      },
    });
  } catch (error) { next(error); }
};

