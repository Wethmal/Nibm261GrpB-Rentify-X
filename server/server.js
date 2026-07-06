/**
 * @file server.js
 * @module Server
 *
 * @description
 * Express application entry point for the Rentify backend. Configures and mounts all
 * global middleware (CORS, Helmet, JSON parser), registers all API route modules under
 * the /api/v1/ prefix, and mounts the global error handler as the final middleware.
 * Exports the Express app instance separately from the listen() call so that test
 * suites can import the app without starting the HTTP server. The server binds to
 * the port specified by the PORT environment variable.
 *
 * @dependencies
 * - express: Web framework for Node.js
 * - cors: Cross-Origin Resource Sharing middleware
 * - helmet: Security headers middleware
 * - dotenv: Environment variable loader
 * - ./routes/*: All API route modules
 * - ./middleware/error.middleware.js: Global error handler
 *
 * @exports
 * - app: Express application instance (for testing)
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const { query } = require('./config/db');

// Ensure database booking_status_enum contains 'rejected'
query("ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'rejected'").catch(() => {});

// Warn (do not crash) when the gap-features migration has not been applied to this database
query("SELECT to_regclass('public.provider_payouts') AS t")
  .then((r) => { if (!r.rows[0].t) console.warn('[Rentify] Schema is missing migration 18 - run `npm run migrate` in /server'); })
  .catch(() => {});

const path = require('path');

// --- Import Route Modules ---
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const listingRoutes = require('./routes/listing.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const searchRoutes = require('./routes/search.routes');
const messagingRoutes = require('./routes/messaging.routes');
