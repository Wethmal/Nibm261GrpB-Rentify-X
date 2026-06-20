/**
 * @file booking.model.js
 * @module BookingModel
 * @description Data access layer for bookings. Manages booking records, including bundle bookings spanning multiple listings. Uses transactions where necessary to prevent double-booking.
 * @dependencies ../config/db.js
 * @exports findById, findByConsumer, findByProvider, create, updateStatus, checkAvailabilityConflict
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const { query, getClient } = require('../config/db');

