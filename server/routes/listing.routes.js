/**
 * @file listing.routes.js
 * @module ListingRoutes
 * @description CRUD routes for service and equipment listings. Providers can create, update, and delete their listings. Public routes allow viewing active listings. Mounted under /api/v1/listings/.
 * @dependencies express, ../controllers/listing.controller.js, ../middleware/auth.middleware.js, ../middleware/role.middleware.js, ../middleware/upload.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

// GET /api/v1/listings — List all active listings (with optional filters)
router.get('/', listingController.getAll);

// GET /api/v1/listings/:id — Get listing by ID
router.get('/:id', listingController.getById);

// POST /api/v1/listings — Create a new listing (provider only)
router.post('/', authenticate, authorize('provider'), listingController.create);

// POST /api/v1/listings/:id/photos — Upload multiple photos (provider only, max 10)
router.post('/:id/photos', authenticate, authorize('provider'), upload.array('photos'), listingController.uploadPhotos);

// PUT /api/v1/listings/:id — Update a listing (provider owner only)
router.put('/:id', authenticate, authorize('provider'), listingController.update);

// DELETE /api/v1/listings/:id — Soft-delete a listing (provider owner only)
router.delete('/:id', authenticate, authorize('provider'), listingController.remove);

// GET /api/v1/listings/:id/availability — Get availability for a listing
router.get('/:id/availability', listingController.getAvailability);

// PUT /api/v1/listings/:id/availability — Update availability (provider only)
router.put('/:id/availability', authenticate, authorize('provider'), listingController.updateAvailability);

// GET /api/v1/listings/:id/cancellation-policy — Effective cancellation policy (listing override or platform default)
router.get('/:id/cancellation-policy', require('../controllers/cancellation.controller').getListingPolicy);

// PUT /api/v1/listings/:id/cancellation-policy — Provider sets the policy for their listing
