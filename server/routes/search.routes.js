/**
 * @file search.routes.js
 * @module SearchRoutes
 * @description Search and discovery routes for listings with filtering, sorting, geo-search, and category browsing. Public access — no authentication required. Mounted under /api/v1/search/.
 * @dependencies express, ../controllers/search.controller.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// GET /api/v1/search — Search listings with filters (q, category, district, type, priceMin, priceMax, rating, sort, page, limit)
router.get('/', searchController.search);

// GET /api/v1/search/categories — Get all active categories for search filters
