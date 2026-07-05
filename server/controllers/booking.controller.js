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

    let total_price = Number(listing.price_per_unit) * duration;
    const equipmentItems = [];

    for (const eid of equipmentIds) {
      const eq = await listingModel.findById(eid);
      if (!eq || eq.status !== 'active') {
        return res.status(404).json({ error: 'Not Found', message: 'Equipment listing not found or inactive' });
      }
      if (eq.provider_id !== listing.provider_id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Bundled service and equipment must belong to the same provider'
        });
      }
      const price = Number(eq.price_per_unit) * duration;
      total_price += price;
      equipmentItems.push({ id: eq.id, price });
    }

    // 3. Create booking inside model using SELECT FOR UPDATE lock to prevent race conditions
    let booking;
    try {
      booking = await bookingModel.create({
        consumer_id: req.user.userId,
        provider_id: listing.provider_id,
        service_listing_id: listing.type === 'service' ? listing.id : null,
        equipment_listing_id: equipmentItems.length ? equipmentItems[0].id : (listing.type === 'equipment' ? listing.id : null),
        equipment_items: equipmentItems,
        booking_type: equipmentItems.length ? 'bundle' : listing.type,
        scheduled_date,
        scheduled_time,
        duration_hours: duration,
        total_price,
        notes
      });
    } catch (err) {
      if (err.message === 'AvailabilityConflict') {
        return res.status(409).json({ error: 'Conflict', message: 'Listing is already booked for this slot' });
      }
      throw err;
    }

    // 4. Send HTTP response first (non-blocking)
    res.status(201).json({
      message: 'Booking request sent successfully',
      bookingId: booking.id,
      booking
    });

    // 5. Fire notification to provider asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        const consumerRes = await query('SELECT full_name FROM users WHERE id = $1', [req.user.userId]);
        const consumerName = consumerRes.rows[0]?.full_name || 'A consumer';

        await notificationModel.create({
          user_id: listing.provider_id,
          type: 'new_booking_request',
          title: 'New Booking Request',
          body: `You received a new booking request for "${listing.title}".`,
          metadata: {
            bookingId: booking.id,
            consumerName,
            scheduledDate: scheduled_date
          }
        });
      } catch (notifErr) {
        console.error('Asynchronous notification creation failed:', notifErr);
      }
    });

  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User must be logged in' });
    }

    const { page = 1, limit = 20, upcoming } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    const isUpcoming = upcoming === 'true';

    let result = { bookings: [], totalCount: 0 };
    if (req.user.role === 'consumer') {
      result = await bookingModel.findByConsumer(req.user.userId, { limit: limitNum, offset });
    } else if (req.user.role === 'provider') {
      result = await bookingModel.findByProvider(req.user.userId, { limit: limitNum, offset, upcoming: isUpcoming });
    }

    res.status(200).json({
      bookings: result.bookings,
      totalCount: result.totalCount,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User must be logged in' });
    }

    const { id } = req.params;
    const booking = await bookingModel.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
    }

    if (booking.consumer_id !== req.user.userId && booking.provider_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to view this booking' });
    }

