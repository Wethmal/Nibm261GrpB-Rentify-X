/**
 * @file booking.routes.js
 * @module BookingRoutes
 * @description Booking management routes. Consumers create booking requests, providers accept/reject them. Status transitions are tracked. Mounted under /api/v1/bookings/.
 * @dependencies express, ../controllers/booking.controller.js, ../middleware/auth.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authenticate = require('../middleware/auth.middleware');
const cancellation = require('../controllers/cancellation.controller');

// POST /api/v1/bookings — Create a booking request (consumer)
router.post('/', authenticate, bookingController.create);

// GET /api/v1/bookings — Get bookings (filtered by query params: consumer_id, provider_id, status)
router.get('/', authenticate, bookingController.getAll);

// GET /api/v1/bookings/:id — Get booking by ID
router.get('/:id', authenticate, bookingController.getById);

// PUT /api/v1/bookings/:id/accept — Accept a booking request (provider)
router.put('/:id/accept', authenticate, bookingController.accept);

// PUT /api/v1/bookings/:id/reject — Reject a booking request (provider)
router.put('/:id/reject', authenticate, bookingController.reject);

// PUT /api/v1/bookings/:id/cancel — Cancel a booking (consumer or provider)
router.put('/:id/cancel', authenticate, cancellation.cancelAny);

// POST /api/v1/bookings/:id/cancel — Consumer cancellation with policy-based refund
router.post('/:id/cancel', authenticate, cancellation.cancelByConsumer);

