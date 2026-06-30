/**
 * @file booking.model.js
 * @module BookingModel
 * @description Data access layer for bookings. Manages booking records, including bundle bookings spanning multiple listings. Uses transactions where necessary to prevent double-booking.
 * @dependencies ../config/db.js
 * @exports findById, findByConsumer, findByProvider, create, updateStatus, checkAvailabilityConflict
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const { query, getClient } = require('../config/db');

const findById = async (id) => {
  const sql = `
    SELECT b.*,
           c.full_name AS consumer_name,
           c.email AS consumer_email,
           c.mobile AS consumer_mobile,
           p.full_name AS provider_name,
           p.email AS provider_email,
           p.mobile AS provider_mobile,
           sl.title AS service_listing_title,
           sl.photos AS service_listing_photos,
           sl.district AS service_listing_district,
           el.title AS equipment_listing_title,
           el.photos AS equipment_listing_photos,
           el.district AS equipment_listing_district
    FROM bookings b
    LEFT JOIN users c ON b.consumer_id = c.id
    LEFT JOIN users p ON b.provider_id = p.id
    LEFT JOIN listings sl ON b.service_listing_id = sl.id
    LEFT JOIN listings el ON b.equipment_listing_id = el.id
    WHERE b.id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

const findByConsumer = async (consumerId, options = {}) => {
  const { limit = 20, offset = 0 } = options;
  const countSql = `SELECT COUNT(*) FROM bookings WHERE consumer_id = $1`;
  const countRes = await query(countSql, [consumerId]);
  const totalCount = parseInt(countRes.rows[0].count, 10);

  const sql = `
    SELECT b.*,
           COALESCE(sl.id, el.id) AS primary_listing_id,
           COALESCE(sl.title, el.title, '') AS listing_title,
           COALESCE(sl.photos, el.photos, '[]'::jsonb) AS listing_photos,
           COALESCE(sl.district, el.district, '') AS listing_district,
           sl.title AS service_listing_title,
           el.title AS equipment_listing_title,
           p.full_name AS provider_name
    FROM bookings b
    LEFT JOIN listings sl ON b.service_listing_id = sl.id
    LEFT JOIN listings el ON b.equipment_listing_id = el.id
    LEFT JOIN users p ON b.provider_id = p.id
    WHERE b.consumer_id = $1
    ORDER BY b.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await query(sql, [consumerId, limit, offset]);
  return { bookings: result.rows, totalCount };
};

const findByProvider = async (providerId, options = {}) => {
  const { limit = 20, offset = 0, upcoming = false } = options;

