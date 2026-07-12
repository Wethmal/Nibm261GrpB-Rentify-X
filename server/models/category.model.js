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

const findByType = async (type) => {
  const { rows } = await query(
    'SELECT * FROM categories WHERE type = $1 AND is_active = true ORDER BY name ASC',
    [type]
  );
  return rows;
};

const findById = async (id) => {
  const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const create = async (categoryData) => {
  const { name, type, parent_id = null, is_active = true } = categoryData;
  const { rows } = await query(
    `INSERT INTO categories (name, type, parent_id, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, type, parent_id || null, is_active]
  );
  return rows[0];
};

const update = async (id, updateData) => {
  const allowedFields = ['name', 'type', 'parent_id', 'is_active'];
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      values.push(value === '' ? null : value);
      fields.push(`${key} = $${values.length}`);
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const { rows } = await query(
    `UPDATE categories SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );
  return rows[0] || null;
};

const softDelete = async (id) => {
  const { rows } = await query(
    'UPDATE categories SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findByType, findById, create, update, softDelete };
