/**
 * @file category.model.js
 * @module CategoryModel
 * @description Data access layer for service and equipment categories. Handles hierarchical categories (parent_id) and filtering by type.
 * @dependencies ../config/db.js
 * @exports findAll, findByType, findById, create, update, softDelete
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const { query } = require('../config/db');

const findAll = async (includeInactive = false) => {
  const sql = `
    SELECT c.*,
           COUNT(l.id)::int AS listing_count
    FROM categories c
    LEFT JOIN listings l ON l.category_id = c.id AND l.status != 'deleted'
    ${includeInactive ? '' : 'WHERE c.is_active = true'}
    GROUP BY c.id
    ORDER BY c.type ASC, c.name ASC
  `;
  const { rows } = await query(sql);
  return rows;
};

