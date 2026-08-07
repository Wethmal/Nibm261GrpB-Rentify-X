/**
 * @file user.routes.js
 * @module UserRoutes
 * @description User profile and history API routes. Handles profile retrieval, profile updates, and booking history for authenticated users. All routes require authentication. Mounted under /api/v1/users/.
 * @dependencies express, ../controllers/user.controller.js, ../middleware/auth.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const { uploadNic } = require('../middleware/upload.middleware');


const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

// POST /api/v1/users/:id/report — Report an abusive/fraudulent user
router.post('/:id/report', authenticate, require('../controllers/report.controller').submitReport);

// GET /api/v1/users/me — Get current authenticated user's profile
router.get('/me', authenticate, userController.getProfile);

// PUT /api/v1/users/:id — Update user's profile
router.put('/:id', authenticate, [
  body('full_name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('bio').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('mobile').optional({ checkFalsy: true }).matches(/^(?:\+94|0)7\d{8}$/).withMessage('Invalid Sri Lanka mobile number'),
  body('address').optional({ nullable: true }).isString(),
  body('district').optional({ nullable: true }).isString(),
  body('country').optional({ nullable: true }).isString()
], validate, userController.updateProfile);

// POST /api/v1/users/:id/avatar — Upload user avatar
router.post('/:id/avatar', authenticate, require('../middleware/upload.middleware').uploadSingle, userController.uploadAvatar);

const optionalAuthenticate = require('../middleware/optionalAuth.middleware');

// GET /api/v1/users/:id — Get public profile by user ID
router.get('/:id', optionalAuthenticate, userController.getPublicProfile);

// GET /api/v1/users/:id/bookings — Get booking history for a user
router.get('/:id/bookings', authenticate, userController.getBookingHistory);

