/**
 * @file booking.controller.js
 * @module BookingController
 * @description Handles booking lifecycle: creation, retrieval, accept/reject, cancel, and completion. Validates availability, manages status transitions, and triggers notifications. Delegates to booking.model.js.
 * @dependencies ../models/booking.model.js, ../services/notification.service.js
 * @exports create, getAll, getById, accept, reject, cancel, complete
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const bookingModel = require('../models/booking.model');
const listingModel = require('../models/listing.model');
const notificationModel = require('../models/notification.model');
const { query } = require('../config/db');

const create = async (req, res, next) => {
  try {
    // 1. Validate consumer is logged in and has consumer role
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User must be logged in' });
    }
    if (req.user.role !== 'consumer') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only consumers can create bookings' });
    }

    const { listing_id, equipment_listing_id, equipment_listing_ids, scheduled_date, scheduled_time, duration, notes } = req.body;
    // A bundle may hold several equipment items (US13); accept the legacy single id too
    const equipmentIds = [...new Set([
      ...(Array.isArray(equipment_listing_ids) ? equipment_listing_ids : []),
      ...(equipment_listing_id ? [equipment_listing_id] : []),
    ].filter(Boolean))];

    if (!listing_id || !scheduled_date || !scheduled_time || !duration) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing required booking fields' });
    }

    // 2. Check listing exists and is active
    const listing = await listingModel.findById(listing_id);
    if (!listing || listing.status !== 'active') {
      return res.status(404).json({ error: 'Not Found', message: 'Listing not found or inactive' });
    }

