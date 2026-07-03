/**
 * @file search.controller.js
 * @module SearchController
 * @description Handles search and discovery: full-text search with filters (category, district, price range, rating, type), category listing, and geo-proximity search.
 */

const { query } = require('../config/db');

const search = async (req, res, next) => {
  try {
    await query('SET pg_trgm.similarity_threshold = 0.1');

    const q = req.query.q || '';
    const categoryId = req.query.category_id || req.query.category || '';
    const district = req.query.district || '';
    const minPrice = req.query.min_price || req.query.priceMin || '';
    const maxPrice = req.query.max_price || req.query.priceMax || '';
    const minRating = req.query.min_rating || req.query.rating || '';
    const type = req.query.type || '';
    const sortBy = req.query.sort_by || req.query.sort || 'relevance';

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const offset = (page - 1) * limit;

    const whereParts = ["l.status = 'active'", "NOT EXISTS (SELECT 1 FROM users ru WHERE ru.id = l.provider_id AND ru.status IN ('banned', 'suspended'))"];
    const values = [];

    if (categoryId) {
      values.push(categoryId);
      whereParts.push(`l.category_id = $${values.length}`);
    }

    if (district) {
      values.push(district);
      whereParts.push(`l.district ILIKE $${values.length}`);
    }

    if (type) {
      values.push(type);
      whereParts.push(`l.type = $${values.length}`);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      values.push(Number(minPrice));
      whereParts.push(`l.price_per_unit >= $${values.length}`);
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      values.push(Number(maxPrice));
      whereParts.push(`l.price_per_unit <= $${values.length}`);
    }

    if (minRating && !isNaN(Number(minRating))) {
      values.push(Number(minRating));
      whereParts.push(`l.average_rating >= $${values.length}`);
    }

    if (q) {
      values.push(`%${q}%`);
      const ilikeIndex = values.length;
      values.push(q);
      const rawIndex = values.length;

      whereParts.push(`(l.title ILIKE $${ilikeIndex} OR l.description ILIKE $${ilikeIndex} OR l.title % $${rawIndex} OR l.description % $${rawIndex})`);
    }

    let orderBy = 'ORDER BY l.created_at DESC';
    if (sortBy === 'price_asc' || sortBy === 'price') {
      orderBy = 'ORDER BY l.price_per_unit ASC';
    } else if (sortBy === 'price_desc') {
      orderBy = 'ORDER BY l.price_per_unit DESC';
    } else if (sortBy === 'newest' || sortBy === 'created_at') {
      orderBy = 'ORDER BY l.created_at DESC';
    } else if (sortBy === 'relevance' && q) {
      const rawIndex = values.indexOf(q) + 1;
      orderBy = `ORDER BY similarity(l.title, $${rawIndex}) DESC, similarity(l.description, $${rawIndex}) DESC`;
    }

