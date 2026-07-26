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

