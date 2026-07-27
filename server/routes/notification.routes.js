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
