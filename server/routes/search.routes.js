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
