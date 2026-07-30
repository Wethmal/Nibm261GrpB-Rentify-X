/**
 * @file auth.middleware.js
 * @module AuthMiddleware
 *
 * @description
 * JWT authentication middleware for Rentify. Extracts the Bearer token from the
 * Authorization header, verifies it using jsonwebtoken, and attaches the decoded
 * user payload (id, role, email) to req.user. Returns 401 if no token is provided
 * or if the token is invalid/expired. Must be placed before any route that requires
 * authentication. Works in conjunction with role.middleware.js for authorization.
 *
 * @dependencies
 * - jsonwebtoken: JWT verification
 *
 * @exports
 * - authenticate: Express middleware function
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware that verifies JWT tokens and attaches user to request.
 */
