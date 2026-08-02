/**
 * @file notification.routes.js
 * @module NotificationRoutes
 * @description Notification feed and preferences routes. Users can fetch notifications, mark as read, and manage notification preferences. Mounted under /api/v1/notifications/.
 * @dependencies express, ../controllers/notification.controller.js, ../middleware/auth.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middleware/auth.middleware');

// GET /api/v1/notifications — Get all notifications for authenticated user
router.get('/', authenticate, notificationController.getAll);

// PUT /api/v1/notifications/:id/read — Mark a notification as read
router.put('/:id/read', authenticate, notificationController.markAsRead);

// PUT /api/v1/notifications/read-all — Mark all notifications as read
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// GET /api/v1/notifications/preferences — Get notification preferences
router.get('/preferences', authenticate, notificationController.getPreferences);

// PUT /api/v1/notifications/preferences — Update notification preferences
router.put('/preferences', authenticate, notificationController.updatePreferences);

module.exports = router;
