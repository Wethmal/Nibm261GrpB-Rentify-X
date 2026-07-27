/**
 * @file review.routes.js
 * @module ReviewRoutes
 * @description Review submission and retrieval routes. Consumers post reviews for completed bookings. Reviews can be fetched by listing or provider. Mounted under /api/v1/reviews/.
 * @dependencies express, ../controllers/review.controller.js, ../middleware/auth.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authenticate = require('../middleware/auth.middleware');

// POST /api/v1/reviews — Submit a review for a completed booking
router.post('/', authenticate, reviewController.create);

// PUT /api/v1/reviews/:id — Edit own review
