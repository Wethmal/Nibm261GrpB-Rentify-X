/**
 * @file admin.routes.js
 * @module AdminRoutes
 * @description Admin-only routes for platform management: provider approvals, NIC verification, listing moderation, user management, category CRUD, disputes, and analytics. All routes require admin role. Mounted under /api/v1/admin/.
 * @dependencies express, ../controllers/admin.controller.js, ../middleware/auth.middleware.js, ../middleware/role.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// Apply auth + admin role to all admin routes
router.use(authenticate, authorize('admin'));

// --- Provider Approvals ---
router.get('/providers', adminController.getPendingProviders);
router.put('/providers/:id/approve', adminController.approveProvider);
router.put('/providers/:id/reject', adminController.rejectProvider);

// --- NIC Verification ---
router.get('/nic-verifications', adminController.getPendingNICVerifications);
router.get('/nic-verifications/:id', adminController.getNICVerificationDetail);
router.put('/nic-verifications/:id/decision', adminController.decideNICVerification);

// --- Listing Moderation ---
router.get('/listings', adminController.getListingsForModeration);
router.put('/listings/:id/approve', adminController.approveListing);
router.put('/listings/:id/suspend', adminController.suspendListing);

// --- User Management ---
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
