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
