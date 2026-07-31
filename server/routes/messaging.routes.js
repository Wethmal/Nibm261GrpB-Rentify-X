/**
 * @file messaging.routes.js
 * @module MessagingRoutes
 * @description In-app messaging routes organized by booking conversations. Authenticated users can send and retrieve messages within a booking context. Mounted under /api/v1/messages/.
 * @dependencies express, ../controllers/messaging.controller.js, ../middleware/auth.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messaging.controller');
const authenticate = require('../middleware/auth.middleware');

// GET /api/v1/messages/conversations — Get all conversations for the authenticated user
router.get('/conversations', authenticate, messagingController.getConversations);

// GET /api/v1/messages/:bookingId — Get messages for a specific booking conversation
