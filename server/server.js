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
