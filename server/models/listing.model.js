/**
 * @file listing.model.js
 * @module ListingModel
 * @description Data access layer for listings (services and equipment). Includes complex query builders for search filtering, pagination, and location-based sorting using Earthdistance/PostGIS.
 * @dependencies ../config/db.js
 * @exports findById, search, create, update, updateStatus, softDelete, getAvailability, upsertAvailability
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const { query } = require('../config/db');

const findById = async (id) => {
  const sql = `
    SELECT l.*, 
           c.name AS category_name, 
           u.full_name AS provider_name, 
           u.email AS provider_email, 
           u.mobile AS provider_mobile,
           u.profile_photo_url AS provider_avatar,
           u.trust_score AS provider_trust_score
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN users u ON l.provider_id = u.id
    WHERE l.id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

