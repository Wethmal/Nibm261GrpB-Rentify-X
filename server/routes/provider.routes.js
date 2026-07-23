/**
 * @file provider.routes.js
 * @description Provider earnings (authenticated provider) and public provider profile routes.
 * Mounted at /api/v1/providers.
 */
const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// --- Earnings (must be declared before /:id) ---
router.get('/me/payouts', authenticate, authorize('provider'), providerController.getPayouts);
