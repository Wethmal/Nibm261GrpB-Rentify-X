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
const restriction = require('../services/restriction.service');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const uid = decoded.userId || decoded.id;
    req.user = {
      ...decoded,
      id: uid,
      userId: uid
    };
    const r = await restriction.checkRestriction(uid);
    if (r.restricted) {
      return res.status(403).json({
        error: 'Account suspended/banned',
        message: r.status === 'banned' ? 'Your account has been banned.' : 'Your account is suspended.',
        code: 'ACCOUNT_RESTRICTED',
        status: r.status,
        reason: r.reason || null,
        until: r.until || null
      });
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token', message: 'Invalid token' });
    }
    return res.status(401).json({ error: 'Invalid token', message: 'Invalid token' });
  }
};

