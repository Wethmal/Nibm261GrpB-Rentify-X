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

const search = async (filters, pagination) => {
  return findAll(filters, pagination);
};

const create = async (listingData) => {
  const {
    provider_id,
    category_id,
    title,
    description,
    type = 'service',
    status = 'pending_approval',
    price_per_unit,
    unit_label,
    deposit_amount = 0.00,
    photos = [],
    district,
    geo_lat = null,
    geo_lng = null,
    condition = null,
    quantity_available = 1,
    tags = [],
    specifications = []
  } = listingData;

  const sql = `
    INSERT INTO listings (
      provider_id,
      category_id,
      title,
      description,
      type,
      status,
      price_per_unit,
      unit_label,
      deposit_amount,
      photos,
      district,
      geo_lat,
      geo_lng,
      condition,
      quantity_available,
      tags,
      specifications
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;

  const values = [
    provider_id,
    category_id,
    title,
    description,
    type,
    status,
    price_per_unit,
    unit_label,
    deposit_amount,
    JSON.stringify(photos),
    district,
    geo_lat,
    geo_lng,
    condition,
    quantity_available,
    JSON.stringify(tags),
    JSON.stringify(specifications)
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

const update = async (id, updateData) => {
  const allowedFields = [
    'title', 'description', 'category_id', 'price_per_unit', 'unit_label', 
    'deposit_amount', 'photos', 'tags', 'district', 'geo_lat', 'geo_lng', 
    'condition', 'quantity', 'quantity_available', 'specifications', 'status'
  ];
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${index}`);
      if (key === 'photos' || key === 'tags' || key === 'specifications') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      index++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const queryText = `UPDATE listings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
  const { rows } = await query(queryText, values);
  return rows[0] || null;
};

const updateStatus = async (id, status) => {
  const result = await query(
    'UPDATE listings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0] || null;
};

const softDelete = async (id) => {
  const result = await query(
    "UPDATE listings SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
};

const getAvailability = async (listingId, startDate, endDate) => {
  const values = [listingId];
  const where = ['listing_id = $1'];

  if (startDate) {
    values.push(startDate);
    where.push(`date >= $${values.length}`);
  }
  if (endDate) {
    values.push(endDate);
    where.push(`date <= $${values.length}`);
  }

  const { rows } = await query(
    `SELECT * FROM listing_availability
     WHERE ${where.join(' AND ')}
     ORDER BY date ASC`,
    values
  );
  return rows;
};

const upsertAvailability = async (listingId, availabilityData) => {
  const { date, is_available, isAvailable, blocked_reason, blockedReason } = availabilityData;
  const { rows } = await query(
    `INSERT INTO listing_availability (listing_id, date, is_available, blocked_reason)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (listing_id, date)
     DO UPDATE SET is_available = EXCLUDED.is_available,
                   blocked_reason = EXCLUDED.blocked_reason,
                   updated_at = NOW()
     RETURNING *`,
    [listingId, date, is_available ?? isAvailable, blocked_reason ?? blockedReason ?? null]
  );
  return rows[0];
};

const findAll = async (filters = {}, pagination = {}) => {
  const { provider_id, category_id, type, status = 'active', q, district, min_price, max_price } = filters;
  const { limit = 20, offset = 0 } = pagination;

  const whereParts = [];
  const values = [];

  if (status !== 'all') {
    values.push(status);
    whereParts.push(`l.status = $${values.length}`);
  } else {
    whereParts.push("l.status != 'deleted'");
  }

  if (provider_id) {
    values.push(provider_id);
    whereParts.push(`l.provider_id = $${values.length}`);
  }

  if (category_id) {
    values.push(category_id);
    whereParts.push(`l.category_id = $${values.length}`);
  }

  if (type) {
    values.push(type);
    whereParts.push(`l.type = $${values.length}`);
  }

  if (district) {
    values.push(district);
    whereParts.push(`l.district ILIKE $${values.length}`);
  }

  if (min_price !== undefined && min_price !== '' && !Number.isNaN(Number(min_price))) {
    values.push(Number(min_price));
    whereParts.push(`l.price_per_unit >= $${values.length}`);
  }

  if (max_price !== undefined && max_price !== '' && !Number.isNaN(Number(max_price))) {
    values.push(Number(max_price));
    whereParts.push(`l.price_per_unit <= $${values.length}`);
  }

  if (q) {
    values.push(`%${q}%`);
    whereParts.push(`(l.title ILIKE $${values.length} OR l.description ILIKE $${values.length})`);
  }

  const whereClause = whereParts.length > 0 ? 'WHERE ' + whereParts.join(' AND ') : '';

  const countSql = `SELECT COUNT(*) FROM listings l ${whereClause}`;
  const countRes = await query(countSql, values);
  const total = parseInt(countRes.rows[0].count, 10);

