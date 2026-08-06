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

