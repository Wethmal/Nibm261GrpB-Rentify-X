const { query } = require('../config/db');

const findByListing = async (listingId) => {
  const sql = `
    SELECT r.id, r.reviewer_id, r.rating, r.comment, r.created_at, r.updated_at, u.full_name AS reviewer_name, u.profile_photo_url AS reviewer_avatar
    FROM reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.listing_id = $1 AND r.status = 'approved'
    ORDER BY r.created_at DESC
  `;
  const result = await query(sql, [listingId]);
  return result.rows;
};

const findByProvider = async (providerId) => {
  const sql = `
    SELECT r.*, u.full_name AS reviewer_name, l.title AS listing_title
    FROM reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    LEFT JOIN listings l ON r.listing_id = l.id
    WHERE r.reviewee_id = $1 AND r.status = 'approved'
    ORDER BY r.created_at DESC
  `;
  const { rows } = await query(sql, [providerId]);
  return rows;
};

const create = async (reviewData) => {
  const { booking_id, reviewer_id, reviewee_id, listing_id, rating, comment, status = 'approved' } = reviewData;
  const { rows } = await query(
    `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, listing_id, rating, comment, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [booking_id, reviewer_id, reviewee_id, listing_id, rating, comment || '', status]
  );
  return rows[0];
};

const updateStatus = async (id, status) => {
  const { rows } = await query(
    'UPDATE reviews SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return rows[0] || null;
};

const calculateAverageRating = async (targetId, type = 'listing') => {
  const column = type === 'provider' ? 'reviewee_id' : 'listing_id';
  const { rows } = await query(
    `SELECT COALESCE(AVG(rating), 0)::numeric(3,2) AS average_rating,
            COUNT(*)::int AS review_count
     FROM reviews
     WHERE ${column} = $1 AND status = 'approved'`,
    [targetId]
  );
  return rows[0] || { average_rating: 0, review_count: 0 };
};

module.exports = { findByListing, findByProvider, create, updateStatus, calculateAverageRating };
