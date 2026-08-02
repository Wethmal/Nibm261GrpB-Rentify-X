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
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const providerRoutes = require('./routes/provider.routes');
const realtimeRoutes = require('./routes/realtime.routes');

// --- Import Middleware ---
const errorMiddleware = require('./middleware/error.middleware');

// --- Initialize Express App ---
const app = express();

// --- Global Middleware ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // In development mode, allow any localhost origin
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');

    if (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && isLocalhost)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Static File Serving (uploaded avatars, listing photos, NIC docs) ---
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// --- Health Check ---
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

