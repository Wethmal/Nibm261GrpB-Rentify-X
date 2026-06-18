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
