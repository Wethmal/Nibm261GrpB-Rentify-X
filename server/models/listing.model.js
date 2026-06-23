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

