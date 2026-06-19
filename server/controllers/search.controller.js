/**
 * @file search.controller.js
 * @module SearchController
 * @description Handles search and discovery: full-text search with filters (category, district, price range, rating, type), category listing, and geo-proximity search.
 */

const { query } = require('../config/db');

const search = async (req, res, next) => {
  try {
    await query('SET pg_trgm.similarity_threshold = 0.1');

