/**
 * @file role.middleware.js
 * @module RoleMiddleware
 *
 * @description
 * Role-based access control middleware for Rentify. Returns a middleware function
 * that checks if the authenticated user's role (from req.user.role, set by
 * auth.middleware.js) is included in the list of allowed roles. Returns 403 if
 * the user's role is not authorized. Must be used after authenticate middleware.
 *
 * @dependencies
 * - None (relies on req.user being set by auth.middleware.js)
 *
 * @exports
 * - authorize: Function that accepts allowed roles and returns middleware
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

/**
 * Creates a middleware that restricts access to specified roles.
 *
 * @param  {...string} allowedRoles - Roles permitted to access the route (e.g., 'admin', 'provider')
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/admin/users', authenticate, authorize('admin'), controller.getUsers);
 * router.post('/listings', authenticate, authorize('provider', 'admin'), controller.create);
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions', message: 'Insufficient permissions' });
    }

    next();
  };
};

requireRole.requireRole = requireRole;

module.exports = requireRole;
